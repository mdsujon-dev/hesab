import type { Metadata } from "next";
import { TransactionsView } from "@/components/views/transactions-view";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return <TransactionsView />;
}
