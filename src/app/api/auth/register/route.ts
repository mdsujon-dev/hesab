import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handle, jsonError } from "@/lib/api";
import { createSession } from "@/lib/session";
import { registerSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { User } from "@/models/User";
import { Category } from "@/models/Category";

export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(`register:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form", fields: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    const { name, email, password } = parsed.data;
    const phone = parsed.data.phone?.trim() ? parsed.data.phone.trim() : null;

    await connectDB();

    const existing = await User.findOne({
      $or: [{ email }, ...(phone ? [{ phone }] : [])],
    }).lean();
    if (existing) {
      return jsonError("An account with these details already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, passwordHash });

    // Seed the default category set so the workspace is usable immediately.
    const now = new Date();
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((category, index) => ({
        userId: user._id,
        localId: `seed-${index}-${category.type}`,
        name: category.name,
        type: category.type,
        icon: category.icon,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })),
    );

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
