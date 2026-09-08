import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { handle, requireUser } from "@/lib/api";
import { categorySchema, fieldErrors } from "@/lib/validation";
import { serializeCategory } from "@/lib/serialize";
import { Category } from "@/models/Category";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    await connectDB();

    const type = request.nextUrl.searchParams.get("type");
    const query: Record<string, unknown> = { userId: user.id, deletedAt: null };
    if (type === "income" || type === "expense") query.type = type;

    const docs = await Category.find(query).sort({ type: 1, name: 1 }).lean();
    return NextResponse.json({ categories: docs.map(serializeCategory) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const data = parsed.data;

    const doc = await Category.findOneAndUpdate(
      { userId: user.id, localId: data.localId },
      {
        $set: {
          name: data.name,
          type: data.type,
          icon: data.icon ?? null,
          status: data.status ?? "active",
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
          syncedAt: new Date(),
        },
        $setOnInsert: { userId: user.id, localId: data.localId },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ category: serializeCategory(doc!) });
  });
}
