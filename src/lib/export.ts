"use client";

import type { Transaction, Totals } from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

const HEADERS = [
  "Date",
  "Type",
  "Category",
  "Payment method",
  "Note",
  "Amount",
] as const;

function toRows(transactions: Transaction[]) {
  return transactions.map((tx) => [
    formatDate(tx.date),
    tx.type === "income" ? "Income" : "Expense",
    tx.categoryName ?? "Uncategorized",
    PAYMENT_METHOD_LABELS[tx.paymentMethod],
    tx.note ?? "",
    tx.amount.toFixed(2),
  ]);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string) {
  // Fields containing a quote, comma or newline must be quoted.
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * CSV that Excel opens correctly. The BOM keeps non-ASCII notes (Bangla, for
 * example) readable when Excel guesses the encoding.
 */
export function exportCsv({
  transactions,
  totals,
  filename,
  currency,
}: {
  transactions: Transaction[];
  totals: Totals;
  filename: string;
  currency: string;
}) {
  const lines = [
    HEADERS.join(","),
    ...toRows(transactions).map((row) => row.map(escapeCsv).join(",")),
    "",
    `Total income,,,,,${totals.income.toFixed(2)}`,
    `Total expense,,,,,${totals.expense.toFixed(2)}`,
    `Balance,,,,,${totals.balance.toFixed(2)}`,
    `Currency,,,,,${currency}`,
  ];

  download(
    new Blob(["﻿", lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    }),
    `${filename}.csv`,
  );
}

export async function exportPdf({
  transactions,
  totals,
  filename,
  title,
  subtitle,
  currency,
}: {
  transactions: Transaction[];
  totals: Totals;
  filename: string;
  title: string;
  subtitle: string;
  currency: string;
}) {
  // Loaded on demand: jsPDF is large and only needed when someone exports.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;

  doc.setFontSize(16);
  doc.text(title, marginX, 48);

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(subtitle, marginX, 66);
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    doc.internal.pageSize.getWidth() - marginX,
    66,
    { align: "right" },
  );

  doc.setTextColor(0);
  doc.setFontSize(11);

  // jsPDF's core fonts are Latin-1 only, so currency symbols outside that
  // range (the taka sign, for one) are written as the ISO code instead.
  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  autoTable(doc, {
    startY: 92,
    head: [[...HEADERS.slice(0, 5), `Amount (${currency})`]],
    body: toRows(transactions),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    // Brand gold, with dark text — matches the app rather than the old palette.
    headStyles: { fillColor: [184, 144, 31], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 52 },
      5: { halign: "right", cellWidth: 78 },
    },
    margin: { left: marginX, right: marginX },
    foot: [
      ["Total income", "", "", "", "", money(totals.income)],
      ["Total expense", "", "", "", "", money(totals.expense)],
      ["Balance", "", "", "", "", money(totals.balance)],
    ],
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Hesab · page ${page} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(`${filename}.pdf`);
}

export function printReport() {
  window.print();
}

/** Shared by the export buttons so filenames stay predictable. */
export function reportFilename(prefix: string, ...parts: string[]) {
  return [prefix, ...parts]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export { formatMoney };
