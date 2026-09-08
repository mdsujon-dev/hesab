"use client";

import { useState } from "react";
import { App, Button, Dropdown } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { exportCsv, exportPdf, printReport } from "@/lib/export";
import type { Totals, Transaction } from "@/lib/types";

export function ExportButtons({
  transactions,
  totals,
  currency,
  title,
  subtitle,
  filename,
  size = "middle",
}: {
  transactions: Transaction[];
  totals: Totals;
  currency: string;
  title: string;
  subtitle: string;
  filename: string;
  size?: "small" | "middle" | "large";
}) {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const empty = transactions.length === 0;

  async function run(kind: "csv" | "pdf" | "print") {
    if (empty && kind !== "print") {
      message.info("Nothing to export for this period");
      return;
    }

    setBusy(true);
    try {
      if (kind === "csv") {
        exportCsv({ transactions, totals, filename, currency });
        message.success("CSV downloaded");
      } else if (kind === "pdf") {
        await exportPdf({
          transactions,
          totals,
          filename,
          title,
          subtitle,
          currency,
        });
        message.success("PDF downloaded");
      } else {
        printReport();
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Export failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: [
          {
            key: "pdf",
            icon: <FilePdfOutlined />,
            label: "Download PDF",
            onClick: () => run("pdf"),
          },
          {
            key: "csv",
            icon: <FileExcelOutlined />,
            label: "Download CSV / Excel",
            onClick: () => run("csv"),
          },
          {
            key: "print",
            icon: <PrinterOutlined />,
            label: "Print",
            onClick: () => run("print"),
          },
        ],
      }}
    >
      <Button icon={<DownloadOutlined />} loading={busy} size={size} className="no-print">
        Export
      </Button>
    </Dropdown>
  );
}
