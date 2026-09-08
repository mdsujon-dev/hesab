import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handle, jsonError, requireUser } from "@/lib/api";
import { loadRange } from "@/lib/report-query";
import { monthlyReport } from "@/lib/reports";
import { daysInMonth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const now = new Date();
    const year = Number(params.get("year") ?? now.getFullYear());
    const month = Number(params.get("month") ?? now.getMonth() + 1);

    if (!Number.isInteger(year) || year < 1970 || year > 3000) {
      return jsonError("Invalid year", 422);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return jsonError("Invalid month", 422);
    }

    const pad = `${month}`.padStart(2, "0");
    const rows = await loadRange(
      user.id,
      `${year}-${pad}-01`,
      `${year}-${pad}-${`${daysInMonth(year, month)}`.padStart(2, "0")}`,
    );

    return NextResponse.json({ report: monthlyReport(rows, year, month) });
  });
}
