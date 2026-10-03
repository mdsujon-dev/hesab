"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Col, Empty, Row, Space, Typography } from "antd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightOutlined,
  FallOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { OfflineBanner } from "@/components/shell/sync-status";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { CategoryDonut, IncomeExpenseBars } from "@/components/charts/charts";
import { categoryBreakdown, monthlyReport, sortByDateDesc } from "@/lib/reports";
import { totalsOf, toDateKey, todayKey, MONTH_NAMES, formatDate } from "@/lib/utils";
import { GOLD } from "@/components/providers/theme-provider";
import type { TxType } from "@/lib/types";
import { MiniLoader } from "@/components/ui/loader";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { transactions, pendingIds, user, loading } = useWorkspace();
  const [adding, setAdding] = useState<TxType | null>(null);

  const today = todayKey();
  // Derived from `today` so the memo below stays stable between renders.
  const [year, month1] = useMemo(() => {
    const date = new Date(`${today}T00:00:00`);
    return [date.getFullYear(), date.getMonth() + 1] as const;
  }, [today]);

  const data = useMemo(() => {
    const todaysRows = transactions.filter((tx) => toDateKey(tx.date) === today);
    const month = monthlyReport(transactions, year, month1);

    return {
      today: totalsOf(todaysRows),
      month,
      recent: sortByDateDesc(transactions).slice(0, 8),
      expenseByCategory: categoryBreakdown(month.transactions, "expense"),
    };
    // `today` changes daily; `transactions` on every edit.
  }, [transactions, today, year, month1]);

  if (loading) return <MiniLoader label="Loading your records" />;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      {/* Greeting + quick add: the two things wanted on opening the app. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {greeting()},{" "}
            <span className="gold-text">{user.name.split(" ")[0]}</span>
          </Typography.Title>
          <Typography.Text type="secondary" className="text-xs">
            {formatDate(today)}
          </Typography.Text>
        </div>
      </div>

      <Row gutter={[12, 12]} className="no-print">
        <Col xs={12}>
          <Button
            tone="income"
            size="large"
            block
            icon={<RiseOutlined />}
            onClick={() => setAdding("income")}
            style={{ height: 50 }}
          >
            Add income
          </Button>
        </Col>
        <Col xs={12}>
          <Button
            tone="expense"
            size="large"
            block
            icon={<FallOutlined />}
            onClick={() => setAdding("expense")}
            style={{ height: 50 }}
          >
            Add expense
          </Button>
        </Col>
      </Row>

      <div>
        <SectionLabel>Today</SectionLabel>
        <SummaryCards totals={data.today} currency={user.currency} />
      </div>

      <div>
        <SectionLabel>
          {MONTH_NAMES[month1 - 1]} {year}
        </SectionLabel>
        <SummaryCards totals={data.month.totals} currency={user.currency} />
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={14}>
          <Card
            title="Income vs Expense"
            extra={
              <Link href="/reports/monthly">
                Details <ArrowRightOutlined />
              </Link>
            }
          >
            <IncomeExpenseBars
              data={data.month.series}
              currency={user.currency}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title="Expenses by category"
            extra={
              <Link href="/reports/category">
                Details <ArrowRightOutlined />
              </Link>
            }
          >
            <CategoryDonut
              data={data.expenseByCategory}
              currency={user.currency}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent transactions"
        extra={
          <Link href="/transactions">
            See all <ArrowRightOutlined />
          </Link>
        }
        styles={{ body: { paddingTop: 4 } }}
      >
        {data.recent.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No transactions yet. Add your first one above."
          />
        ) : (
          <TransactionList
            transactions={data.recent}
            currency={user.currency}
            pendingIds={pendingIds}
            pageSize={8}
          />
        )}
      </Card>

      <TransactionModal
        open={adding !== null}
        type={adding ?? "expense"}
        onClose={() => setAdding(null)}
      />
    </Space>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-4 w-[3px] rounded-full"
        style={{ background: GOLD }}
      />
      <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
        {children}
      </Typography.Title>
    </div>
  );
}
