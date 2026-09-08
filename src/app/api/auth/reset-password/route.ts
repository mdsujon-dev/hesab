import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handle, jsonError } from "@/lib/api";
import { resetPasswordSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { User } from "@/models/User";

export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(`reset:${clientIp(request)}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();

    const tokenHash = createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    }).select("+resetTokenHash +resetTokenExpires +passwordHash");

    if (!user || user.status !== "active") {
      return jsonError(
        "This reset link is invalid or has expired. Request a new one.",
        400,
      );
    }

    user.set({
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      // Single use: clear the token so the same link cannot be replayed.
      resetTokenHash: null,
      resetTokenExpires: null,
    });
    await user.save();

    // Signing them straight in saves a second password entry.
    await createSession(String(user._id));

    return NextResponse.json({
      ok: true,
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
