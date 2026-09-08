import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handle, jsonError, requireUser } from "@/lib/api";
import { passwordChangeSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { User } from "@/models/User";

export async function POST(request: Request) {
  return handle(async () => {
    const current = await requireUser();
    const limit = rateLimit(`password:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) return jsonError("Too many attempts. Try again later.", 429);

    const body = await request.json().catch(() => null);
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const user = await User.findById(current.id).select("+passwordHash");
    if (!user) return jsonError("Account not found", 404);

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) return jsonError("Current password is incorrect", 401);

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();

    return NextResponse.json({ ok: true });
  });
}
