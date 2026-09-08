import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { handle, jsonError, requireUser } from "@/lib/api";
import { transactionPatchSchema, fieldErrors } from "@/lib/validation";
import { serializeTransaction } from "@/lib/serialize";
import { Transaction } from "@/models/Transaction";

// `id` accepts either the Mongo _id or the client-generated localId, so an
// offline record can be edited before it has ever reached the server.
function matcher(userId: string, id: string) {
  return isValidObjectId(id)
    ? { userId, _id: id }
    : { userId, localId: id };
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/transactions/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;

    const body = await request.json().catch(() => null);
    const parsed = transactionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const data = parsed.data;
    const update: Record<string, unknown> = {};

    if (data.type !== undefined) update.type = data.type;
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.categoryId !== undefined) update.categoryId = data.categoryId ?? null;
    if (data.categoryName !== undefined)
      update.categoryName = data.categoryName ?? null;
    if (data.date !== undefined) update.date = new Date(data.date);
    if (data.note !== undefined) update.note = data.note;
    if (data.paymentMethod !== undefined)
      update.paymentMethod = data.paymentMethod;
    if (data.deletedAt !== undefined)
      update.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;

    update.syncedAt = new Date();

    const doc = await Transaction.findOneAndUpdate(
      matcher(user.id, id),
      { $set: update },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return jsonError("Transaction not found", 404);
    return NextResponse.json({ transaction: serializeTransaction(doc) });
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/transactions/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await connectDB();

    // Soft delete: the tombstone is what lets other devices learn about it.
    const doc = await Transaction.findOneAndUpdate(
      matcher(user.id, id),
      { $set: { deletedAt: new Date(), syncedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return jsonError("Transaction not found", 404);
    return NextResponse.json({ transaction: serializeTransaction(doc) });
  });
}
