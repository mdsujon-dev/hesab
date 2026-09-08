import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { handle, requireUser } from "@/lib/api";
import { transactionSchema, fieldErrors } from "@/lib/validation";
import { serializeTransaction } from "@/lib/serialize";
import { Transaction } from "@/models/Transaction";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    await connectDB();

    const params = request.nextUrl.searchParams;
    const query: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    const type = params.get("type");
    if (type === "income" || type === "expense") query.type = type;

    const categoryId = params.get("categoryId");
    if (categoryId) query.categoryId = categoryId;

    const from = params.get("from");
    const to = params.get("to");
    if (from || to) {
      const dateRange: Record<string, Date> = {};
      if (from) dateRange.$gte = new Date(`${from}T00:00:00`);
      if (to) dateRange.$lte = new Date(`${to}T23:59:59.999`);
      query.date = dateRange;
    }

    const search = params.get("search");
    if (search) {
      // Escape the input so user text is never treated as a regex.
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { note: { $regex: safe, $options: "i" } },
        { categoryName: { $regex: safe, $options: "i" } },
      ];
    }

    const limit = Math.min(Math.max(Number(params.get("limit") ?? 200), 1), 1000);
    const skip = Math.max(Number(params.get("skip") ?? 0), 0);

    // Server-side ordering, so paging stays correct across pages.
    const SORTS: Record<string, Record<string, 1 | -1>> = {
      "date-desc": { date: -1, createdAt: -1 },
      "date-asc": { date: 1, createdAt: 1 },
      "amount-desc": { amount: -1, date: -1 },
      "amount-asc": { amount: 1, date: -1 },
    };
    const sort = SORTS[params.get("sort") ?? "date-desc"] ?? SORTS["date-desc"];

    const [docs, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      transactions: docs.map(serializeTransaction),
      total,
    });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const data = parsed.data;

    // Upsert on (userId, localId) keeps repeated submissions idempotent.
    const doc = await Transaction.findOneAndUpdate(
      { userId: user.id, localId: data.localId },
      {
        $set: {
          type: data.type,
          amount: data.amount,
          categoryId: data.categoryId ?? null,
          categoryName: data.categoryName ?? null,
          date: new Date(data.date),
          note: data.note ?? "",
          paymentMethod: data.paymentMethod ?? "cash",
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
          syncedAt: new Date(),
        },
        $setOnInsert: { userId: user.id, localId: data.localId },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ transaction: serializeTransaction(doc!) });
  });
}
