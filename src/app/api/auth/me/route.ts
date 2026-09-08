import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handle, jsonError, requireUser } from "@/lib/api";
import { destroySession } from "@/lib/session";
import { profileSchema, fieldErrors } from "@/lib/validation";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return NextResponse.json({ user });
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    const current = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    const phone = parsed.data.phone?.trim() ? parsed.data.phone.trim() : null;
    await connectDB();

    if (phone) {
      const clash = await User.findOne({
        phone,
        _id: { $ne: current.id },
      }).lean();
      if (clash) return jsonError("That phone number is already in use", 409);
    }

    const updated = await User.findByIdAndUpdate(
      current.id,
      { name: parsed.data.name, phone, currency: parsed.data.currency },
      { returnDocument: "after" },
    ).lean();

    if (!updated) return jsonError("Account not found", 404);

    return NextResponse.json({
      user: {
        id: String(updated._id),
        name: updated.name,
        email: updated.email,
        phone: updated.phone ?? null,
        currency: updated.currency ?? "BDT",
      },
    });
  });
}

// Account deletion also removes the workspace data owned by the user.
export async function DELETE(request: Request) {
  return handle(async () => {
    const current = await requireUser();
    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    await connectDB();
    const user = await User.findById(current.id).select("+passwordHash");
    if (!user) return jsonError("Account not found", 404);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return jsonError("Password is incorrect", 401);

    await Promise.all([
      Transaction.deleteMany({ userId: current.id }),
      Category.deleteMany({ userId: current.id }),
    ]);
    await User.findByIdAndDelete(current.id);
    await destroySession();

    return NextResponse.json({ ok: true });
  });
}
