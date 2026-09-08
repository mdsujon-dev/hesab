import type { Metadata } from "next";
import { CustomReportView } from "@/components/views/report-views";

export const metadata: Metadata = { title: "Custom report" };

export default function CustomReportPage() {
  return <CustomReportView />;
}
