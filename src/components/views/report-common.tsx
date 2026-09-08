"use client";

import { Card, Col, Progress, Row, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { OfflineBanner } from "@/components/shell/sync-status";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ExportButtons } from "@/components/export-buttons";
import { CATEGORY_COLORS, CategoryDonut } from "@/components/charts/charts";
import { formatMoney } from "@/lib/money";
import type { CategorySlice } from "@/lib/reports";
import type { Totals, Transaction } from "@/lib/types";

/** Controls + export row that every report page shares. */
export function ReportToolbar({
  children,
  transactions,
  totals,
  title,
  subtitle,
  filename,
}: {
  children: React.ReactNode;
  transactions: Transaction[];
  totals: Totals;
  title: string;
  subtitle: string;
  filename: string;
}) {
  const { user } = useWorkspace();

  return (
    <Card
      variant="outlined"
      styles={{ body: { padding: 12 } }}
      className="no-print"
    >
      {/*
        Flex rather than a grid row: the controls keep their natural widths and
        Export stays on the same line whenever there is room for it, instead of
        being pushed to a line of its own by a fixed column span.
      */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{children}</div>
        <ExportButtons
          transactions={transactions}
          totals={totals}
          currency={user.currency}
          title={title}
          subtitle={subtitle}
          filename={filename}
        />
      </div>
    </Card>
  );
}

export function CategoryTable({
  data,
  currency,
  emptyText = "No data for this period",
}: {
  data: CategorySlice[];
  currency: string;
  emptyText?: string;
}) {
  const columns: ColumnsType<CategorySlice> = [
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (value: string, _row, index) => (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{
              background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
            }}
          />
          <span className="truncate">{value}</span>
        </span>
      ),
    },
    {
      title: "Entries",
      dataIndex: "count",
      key: "count",
      width: 90,
      align: "right",
      responsive: ["sm"],
    },
    {
      title: "Share",
      dataIndex: "percentage",
      key: "percentage",
      width: 160,
      render: (value: number, _row, index) => (
        <Progress
          percent={Number(value.toFixed(1))}
          size="small"
          strokeColor={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 130,
      render: (value: number) => (
        <span className="font-semibold whitespace-nowrap">
          {formatMoney(value, currency)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div className="x-scroll">
      <Table<CategorySlice>
        rowKey={(row) => row.categoryId ?? row.categoryName}
        columns={columns}
        dataSource={data}
        size="small"
        pagination={false}
        locale={{ emptyText }}
        scroll={{ x: 480 }}
        summary={(rows) => {
          const total = rows.reduce((sum, row) => sum + row.amount, 0);
          if (rows.length === 0) return null;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} align="right" />
              <Table.Summary.Cell index={3} align="right">
                <strong className="whitespace-nowrap">
                  {formatMoney(total, currency)}
                </strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
}

/**
 * Summary tiles, category split and the transaction table — the common body of
 * the daily, monthly, yearly and custom reports.
 */
export function ReportBody({
  totals,
  transactions,
  expenseByCategory,
  incomeByCategory,
  chart,
  heading,
}: {
  totals: Totals;
  transactions: Transaction[];
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  chart?: React.ReactNode;
  heading: string;
}) {
  const { user, pendingIds } = useWorkspace();

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <div className="print-area">
        <Typography.Title level={5} className="!mb-2">
          {heading}
        </Typography.Title>
        <SummaryCards totals={totals} currency={user.currency} />
      </div>

      {chart ? (
        <Card variant="outlined" title="Income vs Expense">
          {chart}
        </Card>
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card variant="outlined" title="Expense by category">
            <CategoryDonut
              data={expenseByCategory}
              currency={user.currency}
              height={230}
            />
            <div className="mt-3">
              <CategoryTable
                data={expenseByCategory}
                currency={user.currency}
                emptyText="No expenses in this period"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card variant="outlined" title="Income by category">
            <CategoryDonut
              data={incomeByCategory}
              currency={user.currency}
              height={230}
            />
            <div className="mt-3">
              <CategoryTable
                data={incomeByCategory}
                currency={user.currency}
                emptyText="No income in this period"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        variant="outlined"
        title={`Transactions (${transactions.length})`}
        styles={{ body: { paddingTop: 4 } }}
      >
        <TransactionList
          transactions={transactions}
          currency={user.currency}
          pendingIds={pendingIds}
          emptyText="No transactions in this period"
          pageSize={25}
        />
      </Card>
    </Space>
  );
}

export { OfflineBanner };
