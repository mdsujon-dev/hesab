"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { Button } from "@/components/ui/button";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
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
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/types";

const { RangePicker } = DatePicker;

type TypeFilter = "all" | "income" | "expense";

export function TransactionsView() {
  const { transactions, categories, pendingIds, user } = useWorkspace();

  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fromKey = range ? toDateKey(range[0].toDate()) : null;
  const toKey = range ? toDateKey(range[1].toDate()) : null;

  // See ledger-view: reset the page during render rather than in an effect.
  const filterKey = `${typeFilter}|${fromKey}|${toKey}|${categoryId}|${method}|${debouncedSearch}|${sort}|${pageSize}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const paged = usePagedTransactions({
    type: typeFilter,
    from: fromKey,
    to: toKey,
    categoryId: categoryId || null,
    paymentMethod: method || null,
    search: debouncedSearch,
    sort,
    page,
    pageSize,
  });

  // Totals summarise the whole filtered period, not the visible page.
  const totals = useMemo(() => {
    let rows =
      fromKey && toKey
        ? inRange(transactions, fromKey, toKey)
        : transactions.filter((tx) => !tx.deletedAt);

    if (typeFilter !== "all") rows = rows.filter((tx) => tx.type === typeFilter);
    if (categoryId) rows = rows.filter((tx) => tx.categoryId === categoryId);
    if (method) rows = rows.filter((tx) => tx.paymentMethod === method);

    const term = debouncedSearch.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (tx) =>
          (tx.note ?? "").toLowerCase().includes(term) ||
          (tx.categoryName ?? "").toLowerCase().includes(term) ||
          String(tx.amount).includes(term),
      );
    }

    return { totals: totalsOf(rows), rows };
  }, [
    transactions,
    fromKey,
    toKey,
    typeFilter,
    categoryId,
    method,
    debouncedSearch,
  ]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: category.localId,
        label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
      })),
    ],
    [categories],
  );

  const hasFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    Boolean(categoryId) ||
    Boolean(method) ||
    range !== null;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <Card
        variant="outlined"
        styles={{ body: { padding: 12 } }}
        className="no-print"
      >
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
          {/* Row 1: search, the type filter, and the two actions. */}
          <Row gutter={[8, 8]} align="middle">
            <Col xs={24} md={10} lg={11}>
              <Input
                allowClear
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                prefix={<SearchOutlined className="opacity-45" />}
                suffix={<InlineSpinner active={paged.loading} />}
                placeholder="Search note, category or amount"
              />
            </Col>

            <Col xs={24} sm={12} md={6} lg={5}>
              <Select<TypeFilter>
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: "100%" }}
                options={[
                  { value: "all", label: "All transactions" },
                  { value: "income", label: "Income only" },
                  { value: "expense", label: "Expense only" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={8}>
              <Space size={8} className="w-full md:justify-end" wrap>
                <Button
                  tone="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAdding(true)}
                >
                  Add
                </Button>
                <ExportButtons
                  transactions={totals.rows}
                  totals={totals.totals}
                  currency={user.currency}
                  title="Transactions"
                  subtitle={
                    fromKey && toKey ? `${fromKey} to ${toKey}` : "All time"
                  }
                  filename={reportFilename("transactions")}
                />
              </Space>
            </Col>
          </Row>

          {/* Row 2: the narrowing filters. */}
          <Row gutter={[8, 8]} align="middle">
            <Col xs={24} md={8}>
              <RangePicker
                value={range}
                onChange={(value) =>
                  setRange(
                    value?.[0] && value?.[1] ? [value[0], value[1]] : null,
                  )
                }
                style={{ width: "100%" }}
                format="DD MMM YYYY"
                inputReadOnly
                presets={[
                  {
                    label: "This month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last 30 days",
                    value: [dayjs().subtract(29, "day"), dayjs()],
                  },
                  {
                    label: "This year",
                    value: [dayjs().startOf("year"), dayjs().endOf("year")],
                  },
                ]}
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="label"
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={method}
                onChange={setMethod}
                style={{ width: "100%" }}
                options={[
                  { value: "", label: "All methods" },
                  ...PAYMENT_METHODS.map((item) => ({
                    value: item,
                    label: PAYMENT_METHOD_LABELS[item],
                  })),
                ]}
              />
            </Col>
            <Col xs={16} md={4}>
              <Select<SortKey>
                value={sort}
                onChange={setSort}
                style={{ width: "100%" }}
                options={[
                  { value: "date-desc", label: "Newest first" },
                  { value: "date-asc", label: "Oldest first" },
                  { value: "amount-desc", label: "Highest amount" },
                  { value: "amount-asc", label: "Lowest amount" },
                ]}
              />
            </Col>
            <Col xs={8} md={2}>
              <div className="flex items-center justify-end gap-2">
                {hasFilters ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setCategoryId("");
                      setMethod("");
                      setRange(null);
                      setSort("date-desc");
                    }}
                  >
                    Clear
                  </Button>
                ) : (
                  <Typography.Text type="secondary" className="text-xs">
                    {paged.total} result{paged.total === 1 ? "" : "s"}
                  </Typography.Text>
                )}
              </div>
            </Col>
          </Row>
        </Space>
      </Card>

      <SummaryCards totals={totals.totals} currency={user.currency} />

      <Card variant="outlined" styles={{ body: { paddingTop: 4 } }}>
        <TransactionList
          transactions={paged.rows}
          currency={user.currency}
          pendingIds={pendingIds}
          loading={paged.loading && paged.rows.length === 0}
          emptyText={
            hasFilters
              ? "No transactions match these filters"
              : "No transactions yet"
          }
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
        type="expense"
        allowTypeSwitch
        onClose={() => setAdding(false)}
      />
    </Space>
  );
}
