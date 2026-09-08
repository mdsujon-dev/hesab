import "server-only";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { User } from "@/models/User";
import type { SessionUser } from "@/lib/types";

export function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Resolves the authenticated user for a route handler. Every data query in the
 * app is scoped with the id returned here — never with an id from the request.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new HttpError("Not authenticated", 401);

  await connectDB();
  const user = await User.findById(session.userId).lean();
  if (!user || user.status !== "active") {
    throw new HttpError("Not authenticated", 401);
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    currency: user.currency ?? "BDT",
  };
}

/** Wraps a handler so thrown HttpErrors and unexpected errors become JSON. */
export async function handle(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.message, error.status);
    }
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    // Connection/config problems are the common case in local development.
    console.error("[api]", error);
    return jsonError(message, 500);
  }
}
