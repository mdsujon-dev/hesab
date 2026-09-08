import "server-only";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { User } from "@/models/User";
import type { SessionUser } from "@/lib/types";

/**
 * Server-component variant of `requireUser()`: returns null instead of
 * throwing, so layouts can redirect rather than render an error.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    await connectDB();
  } catch (error) {
    console.error("[auth] database unavailable", error);
    return null;
  }

  const user = await User.findById(session.userId).lean();
  if (!user || user.status !== "active") return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    currency: user.currency ?? "BDT",
  };
}
