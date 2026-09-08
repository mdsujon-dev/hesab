import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { handle, jsonError } from "@/lib/api";
import { forgotPasswordSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { appUrl, sendPasswordResetEmail } from "@/lib/mailer";
import { User } from "@/models/User";

const TOKEN_TTL_MINUTES = 60;

export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60 * 1000);
    if (!limit.ok) {
      return jsonError(
        `Too many reset requests. Try again in ${limit.retryAfter}s.`,
        429,
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email });

    // Always answer the same way. Saying "no such account" here would turn this
    // endpoint into a way to test which email addresses are registered.
    const ok = NextResponse.json({
      ok: true,
      message:
        "If that email has an account, a reset link is on its way. Check your inbox and spam folder.",
    });

    if (!user || user.status !== "active") return ok;

    // The raw token goes in the email; only its hash is stored.
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    user.set({
      resetTokenHash: tokenHash,
      resetTokenExpires: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
    });
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: `${appUrl()}/reset-password?token=${token}`,
        expiresInMinutes: TOKEN_TTL_MINUTES,
      });
    } catch (error) {
      // Don't leave a usable token behind if the mail never went out.
      user.set({ resetTokenHash: null, resetTokenExpires: null });
      await user.save();
      console.error("[forgot-password] could not send email", error);
      return jsonError(
        "Could not send the reset email right now. Please try again shortly.",
        502,
      );
    }

    return ok;
  });
}
