import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handle, jsonError } from "@/lib/api";
import { createSession } from "@/lib/session";
import { loginSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { User } from "@/models/User";

export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(`login:${clientIp(request)}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      return jsonError(
        `Too many login attempts. Try again in ${limit.retryAfter}s.`,
        429,
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    const { identifier, password } = parsed.data;
    await connectDB();

    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query).select("+passwordHash");
    // Same message for unknown user and wrong password: no account enumeration.
    if (!user || user.status !== "active") {
      return jsonError("Email, phone or password is incorrect", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return jsonError("Email, phone or password is incorrect", 401);
    }

    await createSession(String(user._id));

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        currency: user.currency ?? "BDT",
      },
    });
  });
}
