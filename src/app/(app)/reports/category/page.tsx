import type { Metadata } from "next";
import { CategoryReportView } from "@/components/views/report-views";

export const metadata: Metadata = { title: "Category report" };

export default function CategoryReportPage() {
  return <CategoryReportView />;
}
