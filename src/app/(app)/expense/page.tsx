import { Suspense } from "react";
import type { Metadata } from "next";
import { LedgerView } from "@/components/views/ledger-view";
import { MiniLoader } from "@/components/ui/loader";

export const metadata: Metadata = { title: "Expense" };

export default function ExpensePage() {
  return (
    <Suspense fallback={<MiniLoader />}>
      <LedgerView type="expense" />
    </Suspense>
  );
}
