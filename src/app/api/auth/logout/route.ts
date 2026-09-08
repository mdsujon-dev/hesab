import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { destroySession } from "@/lib/session";

export async function POST() {
  return handle(async () => {
    await destroySession();
    return NextResponse.json({ ok: true });
  });
}
