import { Suspense } from "react";
import type { Metadata } from "next";
import { LedgerView } from "@/components/views/ledger-view";
import { MiniLoader } from "@/components/ui/loader";

export const metadata: Metadata = { title: "Income" };

export default function IncomePage() {
  return (
    <Suspense fallback={<MiniLoader />}>
      <LedgerView type="income" />
    </Suspense>
  );
}
