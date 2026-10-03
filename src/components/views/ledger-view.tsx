"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DatePicker,
  Select,
  Space,
  Typography,
} from "antd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { OfflineBanner } from "@/components/shell/sync-status";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { ExportButtons } from "@/components/export-buttons";
import { InlineSpinner } from "@/components/ui/loader";
import {
  usePagedTransactions,
  type SortKey,
} from "@/hooks/use-paged-transactions";
import { inRange } from "@/lib/reports";
import { reportFilename } from "@/lib/export";
import { toDateKey, totalsOf } from "@/lib/utils";
import type { TxType } from "@/lib/types";

const { RangePicker } = DatePicker;

/** Shared by the Income and Expense pages — same screen, different type. */
export function LedgerView({ type }: { type: TxType }) {
  const { transactions, categories, pendingIds, user } = useWorkspace();
  const params = useSearchParams();

  // The PWA shortcuts (/income?new=1) open straight into the form.
  const [adding, setAdding] = useState(() => params.get("new") === "1");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const label = type === "income" ? "Income" : "Expense";
  const fromKey = toDateKey(range[0].toDate());
  const toKey = toDateKey(range[1].toDate());

  // Any filter change invalidates the current page. Adjusting during render is
  // React's recommended alternative to a reset-in-effect: it happens before
  // paint, so no page-1 request is ever fired with a stale page number.
  const filterKey = `${type}|${fromKey}|${toKey}|${categoryId}|${sort}|${pageSize}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const paged = usePagedTransactions({
    type,
    from: fromKey,
    to: toKey,
    categoryId,
    sort,
    page,
    pageSize,
  });

  // Totals and exports cover the whole period, not just the visible page, so
  // they are computed from the local mirror.
  const periodRows = useMemo(() => {
    const rows = inRange(transactions, fromKey, toKey).filter(
      (tx) => tx.type === type && (!categoryId || tx.categoryId === categoryId),
    );
    return rows;
  }, [transactions, fromKey, toKey, type, categoryId]);

  const totals = useMemo(() => totalsOf(periodRows), [periodRows]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories
        .filter((category) => category.type === type)
        .map((category) => ({
          value: category.localId,
          label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
        })),
    ],
    [categories, type],
  );

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <Card compact className="no-print">
        {/*
          Flex with fixed control widths rather than a 24-column grid: the
          controls only take the room they need, which keeps the two actions on
          the same line instead of being pushed onto a second row.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker
            value={range}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) setRange([value[0], value[1]]);
            }}
            allowClear={false}
            style={{ width: 250 }}
            format="DD MMM YYYY"
            inputReadOnly
            presets={[
              {
                label: "This month",
                value: [dayjs().startOf("month"), dayjs().endOf("month")],
              },
              {
                label: "Last month",
                value: [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
              },
              {
                label: "This year",
                value: [dayjs().startOf("year"), dayjs().endOf("year")],
              },
            ]}
          />

          <Select
            value={categoryId ?? ""}
            onChange={(value) => setCategoryId(value || null)}
            options={categoryOptions}
            style={{ width: 168 }}
            showSearch
            optionFilterProp="label"
          />

          <Select<SortKey>
            value={sort}
            onChange={setSort}
            style={{ width: 148 }}
            options={[
              { value: "date-desc", label: "Newest first" },
              { value: "date-asc", label: "Oldest first" },
              { value: "amount-desc", label: "Highest amount" },
              { value: "amount-asc", label: "Lowest amount" },
            ]}
          />

          <div className="ms-auto flex items-center gap-2">
            <Button
              tone="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdding(true)}
            >
              Add
            </Button>
            <ExportButtons
              transactions={periodRows}
              totals={totals}
              currency={user.currency}
              title={`${label} report`}
              subtitle={`${fromKey} to ${toKey}`}
              filename={reportFilename(type, fromKey, toKey)}
            />
          </div>
        </div>
      </Card>

      <SummaryCards totals={totals} currency={user.currency} />

      <Card
        title={
          <span className="flex items-center gap-2">
            {label} entries
            <InlineSpinner active={paged.loading} />
          </span>
        }
        extra={
          <Typography.Text type="secondary" className="text-xs">
            {paged.total} total
          </Typography.Text>
        }
        styles={{ body: { paddingTop: 4 } }}
      >
        <TransactionList
          transactions={paged.rows}
          currency={user.currency}
          pendingIds={pendingIds}
          loading={paged.loading && paged.rows.length === 0}
          emptyText={`No ${label.toLowerCase()} in this period`}
          serverPagination={{
            current: page,
            pageSize,
            total: paged.total,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </Card>

      <TransactionModal
        open={adding}
        type={type}
        onClose={() => setAdding(false)}
      />
    </Space>
  );
}
