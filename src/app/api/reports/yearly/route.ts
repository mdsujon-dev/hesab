import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handle, jsonError, requireUser } from "@/lib/api";
import { loadRange } from "@/lib/report-query";
import { yearlyReport } from "@/lib/reports";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const year = Number(
      request.nextUrl.searchParams.get("year") ?? new Date().getFullYear(),
    );
    if (!Number.isInteger(year) || year < 1970 || year > 3000) {
      return jsonError("Invalid year", 422);
    }

    const rows = await loadRange(user.id, `${year}-01-01`, `${year}-12-31`);
    return NextResponse.json({ report: yearlyReport(rows, year) });
  });
}
