import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { handle, jsonError, requireUser } from "@/lib/api";
import { syncSchema, fieldErrors } from "@/lib/validation";
import { serializeCategory, serializeTransaction } from "@/lib/serialize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import type { Model } from "mongoose";

type Incoming = {
  localId: string;
  updatedAt?: string;
  createdAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
};

/**
 * Push/pull sync.
 *
 * Push is idempotent: records are keyed by (userId, localId), so replaying the
 * same batch after a failed request cannot create duplicates. Conflicts resolve
 * last-write-wins on the client `updatedAt`, and a push that is older than what
 * the server already holds is skipped rather than applied.
 *
 * Pull returns everything with `syncedAt` newer than the client cursor,
 * including tombstones, so deletes and edits reach every device.
 */
async function pushBatch<T extends Record<string, unknown>>(
  model: Model<never> | Model<T>,
  userId: string,
  items: Incoming[],
  toSet: (item: Incoming) => Record<string, unknown>,
) {
  if (items.length === 0) return { applied: 0, skipped: 0 };

  // Collapse duplicates inside one batch, keeping the newest version.
  const byLocalId = new Map<string, Incoming>();
  for (const item of items) {
    const existing = byLocalId.get(item.localId);
    if (!existing || time(item.updatedAt) >= time(existing.updatedAt)) {
      byLocalId.set(item.localId, item);
    }
  }

  const localIds = [...byLocalId.keys()];
  const anyModel = model as Model<Record<string, unknown>>;
  const existingDocs = await anyModel
    .find({ userId, localId: { $in: localIds } })
    .select({ localId: 1, updatedAt: 1 })
    .lean();

  const serverVersion = new Map<string, number>();
  for (const doc of existingDocs) {
    serverVersion.set(String(doc.localId), time(doc.updatedAt as Date));
  }

  const now = new Date();
  const operations = [];
  let skipped = 0;

  for (const item of byLocalId.values()) {
    const incomingAt = time(item.updatedAt);
    const currentAt = serverVersion.get(item.localId);

    if (currentAt !== undefined && currentAt > incomingAt) {
      // Server copy is newer; the pull half of this response will correct
      // the client instead.
      skipped += 1;
      continue;
    }

    operations.push({
      updateOne: {
        filter: { userId, localId: item.localId },
        update: {
          $set: {
            ...toSet(item),
            updatedAt: new Date(incomingAt),
            syncedAt: now,
          },
          $setOnInsert: {
            userId,
            localId: item.localId,
            createdAt: item.createdAt ? new Date(item.createdAt) : now,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    // timestamps:false so the client's logical `updatedAt` survives the write.
    await anyModel.bulkWrite(operations, { ordered: false, timestamps: false });
  }

  return { applied: operations.length, skipped };
}

function time(value: unknown) {
  if (!value) return 0;
  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();

    const limit = rateLimit(`sync:${user.id}:${clientIp(request)}`, 120, 60_000);
    if (!limit.ok) {
      return jsonError("Sync is rate limited. Retrying shortly.", 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid sync payload", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const { transactions, categories, since } = parsed.data;

    const txResult = await pushBatch(Transaction, user.id, transactions, (item) => ({
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId ?? null,
      categoryName: item.categoryName ?? null,
      date: new Date(item.date as string),
      note: item.note ?? "",
      paymentMethod: item.paymentMethod ?? "cash",
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    }));

    const catResult = await pushBatch(Category, user.id, categories, (item) => ({
      name: item.name,
      type: item.type,
      icon: item.icon ?? null,
      status: item.status ?? "active",
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    }));

    // Pull anything the server has seen since the client cursor.
    const cursor = since ? new Date(since) : null;
    const pullFilter = cursor
      ? { userId: user.id, syncedAt: { $gt: cursor } }
      : { userId: user.id };

    const [txDocs, catDocs] = await Promise.all([
      Transaction.find(pullFilter).sort({ syncedAt: 1 }).limit(5000).lean(),
      Category.find(pullFilter).sort({ syncedAt: 1 }).limit(2000).lean(),
    ]);

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      pushed: { transactions: txResult, categories: catResult },
      transactions: txDocs.map(serializeTransaction),
      categories: catDocs.map(serializeCategory),
    });
  });
}
