import type { Metadata } from "next";
import { DailyReportView } from "@/components/views/report-views";

export const metadata: Metadata = { title: "Daily report" };

export default function DailyReportPage() {
  return <DailyReportView />;
}
