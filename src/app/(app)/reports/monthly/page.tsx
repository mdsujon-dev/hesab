import type { Metadata } from "next";
import { MonthlyReportView } from "@/components/views/report-views";

export const metadata: Metadata = { title: "Monthly report" };

export default function MonthlyReportPage() {
  return <MonthlyReportView />;
}
