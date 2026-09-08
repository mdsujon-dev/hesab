import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { handle, jsonError, requireUser } from "@/lib/api";
import { categoryPatchSchema, fieldErrors } from "@/lib/validation";
import { serializeCategory } from "@/lib/serialize";
import { Category } from "@/models/Category";

function matcher(userId: string, id: string) {
  return isValidObjectId(id) ? { userId, _id: id } : { userId, localId: id };
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/categories/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;

    const body = await request.json().catch(() => null);
    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const data = parsed.data;
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.icon !== undefined) update.icon = data.icon ?? null;
    if (data.status !== undefined) update.status = data.status;
    if (data.deletedAt !== undefined)
      update.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;

    update.syncedAt = new Date();

    const doc = await Category.findOneAndUpdate(
      matcher(user.id, id),
      { $set: update },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return jsonError("Category not found", 404);
    return NextResponse.json({ category: serializeCategory(doc) });
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/categories/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await connectDB();

    const doc = await Category.findOneAndUpdate(
      matcher(user.id, id),
      { $set: { deletedAt: new Date(), syncedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return jsonError("Category not found", 404);
    return NextResponse.json({ category: serializeCategory(doc) });
  });
}
