import type { Metadata } from "next";
import { YearlyReportView } from "@/components/views/report-views";

export const metadata: Metadata = { title: "Yearly report" };

export default function YearlyReportPage() {
  return <YearlyReportView />;
}
