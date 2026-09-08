import type { Metadata } from "next";
import { OfflineNotice } from "@/components/views/offline-notice";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return <OfflineNotice />;
}
