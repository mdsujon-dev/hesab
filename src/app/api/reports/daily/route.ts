import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handle, requireUser } from "@/lib/api";
import { loadRange } from "@/lib/report-query";
import { dailyReport } from "@/lib/reports";
import { todayKey } from "@/lib/utils";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const date = request.nextUrl.searchParams.get("date") ?? todayKey();
    const rows = await loadRange(user.id, date, date);
    return NextResponse.json({ report: dailyReport(rows, date) });
  });
}
