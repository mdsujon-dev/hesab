import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handle, jsonError, requireUser } from "@/lib/api";
import { badRange, loadRange } from "@/lib/report-query";
import { customReport } from "@/lib/reports";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const from = params.get("from");
    const to = params.get("to");

    const problem = badRange(from, to);
    if (problem) return jsonError(problem, 422);

    const rows = await loadRange(user.id, from!, to!);
    return NextResponse.json({ report: customReport(rows, from!, to!) });
  });
}
