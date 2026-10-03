"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Row,
  Segmented,
  Space,
  Statistic,
  Typography,
} from "antd";
import { Card } from "@/components/ui/card";
import dayjs, { type Dayjs } from "dayjs";
import { useWorkspace } from "@/components/providers/workspace-provider";
import {
  OfflineBanner,
  ReportBody,
  ReportToolbar,
  CategoryTable,
} from "@/components/views/report-common";
import { CategoryDonut, BalanceTrend, IncomeExpenseBars } from "@/components/charts/charts";
import {
  categoryBreakdown,
  customReport,
  dailyReport,
  monthlyReport,
  yearlyReport,
  inRange,
  sortByDateDesc,
} from "@/lib/reports";
import { reportFilename } from "@/lib/export";
import { formatMoney } from "@/lib/money";
import { MONTH_NAMES, formatDate, toDateKey, todayKey, totalsOf } from "@/lib/utils";
import { EXPENSE, INCOME } from "@/components/providers/theme-provider";
import type { TxType } from "@/lib/types";
import { MiniLoader } from "@/components/ui/loader";

const { RangePicker } = DatePicker;

/* ------------------------------- Daily ---------------------------------- */

export function DailyReportView() {
  const { transactions, loading } = useWorkspace();
  const [date, setDate] = useState<Dayjs>(() => dayjs());

  const dateKey = toDateKey(date.toDate());
  const report = useMemo(
    () => dailyReport(transactions, dateKey),
    [transactions, dateKey],
  );

  if (loading) return <MiniLoader label="Loading your records" />;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <ReportToolbar
        transactions={report.transactions}
        totals={report.totals}
        title="Daily report"
        subtitle={formatDate(dateKey)}
        filename={reportFilename("daily", dateKey)}
      >
        <Space wrap>
          <DatePicker
            value={date}
            onChange={(value) => value && setDate(value)}
            allowClear={false}
            format="DD MMM YYYY"
            inputReadOnly
          />
          <Button onClick={() => setDate(dayjs())} disabled={dateKey === todayKey()}>
            Today
          </Button>
          <Button onClick={() => setDate(date.subtract(1, "day"))}>
            Previous day
          </Button>
          <Button
            onClick={() => setDate(date.add(1, "day"))}
            disabled={dateKey >= todayKey()}
          >
            Next day
          </Button>
        </Space>
      </ReportToolbar>

      <ReportBody
        heading={formatDate(dateKey)}
        totals={report.totals}
        transactions={report.transactions}
        expenseByCategory={report.expenseByCategory}
        incomeByCategory={report.incomeByCategory}
      />
    </Space>
  );
}

/* ------------------------------ Monthly --------------------------------- */

export function MonthlyReportView() {
  const { transactions, user, loading } = useWorkspace();
  const [month, setMonth] = useState<Dayjs>(() => dayjs());

  const year = month.year();
  const month1 = month.month() + 1;

  const report = useMemo(
    () => monthlyReport(transactions, year, month1),
    [transactions, year, month1],
  );

  const busiest = useMemo(() => {
    const top = [...report.series].sort((a, b) => b.expense - a.expense)[0];
    return top && top.expense > 0 ? top : null;
  }, [report.series]);

  if (loading) return <MiniLoader label="Loading your records" />;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <ReportToolbar
        transactions={report.transactions}
        totals={report.totals}
        title="Monthly report"
        subtitle={report.label}
        filename={reportFilename("monthly", `${year}-${month1}`)}
      >
        <Space wrap>
          <DatePicker
            picker="month"
            value={month}
            onChange={(value) => value && setMonth(value)}
            allowClear={false}
            format="MMMM YYYY"
            inputReadOnly
          />
          <Button onClick={() => setMonth(month.subtract(1, "month"))}>
            Previous
          </Button>
          <Button
            onClick={() => setMonth(month.add(1, "month"))}
            disabled={month.isSame(dayjs(), "month")}
          >
            Next
          </Button>
        </Space>
      </ReportToolbar>

      <Row gutter={[12, 12]}>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Daily average expense"
              value={report.totals.expense / report.series.length}
              precision={0}
              formatter={(value) => formatMoney(Number(value), user.currency)}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Highest spending day"
              value={busiest ? `${busiest.label} ${MONTH_NAMES[month1 - 1]}` : "—"}
              styles={{ content: { fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Savings rate"
              value={
                report.totals.income > 0
                  ? (report.totals.balance / report.totals.income) * 100
                  : 0
              }
              precision={1}
              suffix="%"
              styles={{ content: {
                fontSize: 18,
                color: report.totals.balance < 0 ? EXPENSE : INCOME,
              } }}
            />
          </Card>
        </Col>
      </Row>

      <ReportBody
        heading={report.label}
        totals={report.totals}
        transactions={report.transactions}
        expenseByCategory={report.expenseByCategory}
        incomeByCategory={report.incomeByCategory}
        chart={
          <IncomeExpenseBars
            data={report.series}
            currency={user.currency}
            height={280}
          />
        }
      />
    </Space>
  );
}

/* ------------------------------- Yearly --------------------------------- */

export function YearlyReportView() {
  const { transactions, user, loading } = useWorkspace();
  const [year, setYear] = useState<Dayjs>(() => dayjs());

  const yearNumber = year.year();
  const report = useMemo(
    () => yearlyReport(transactions, yearNumber),
    [transactions, yearNumber],
  );

  if (loading) return <MiniLoader label="Loading your records" />;

  const best = [...report.series].sort((a, b) => b.balance - a.balance)[0];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <ReportToolbar
        transactions={report.transactions}
        totals={report.totals}
        title="Yearly report"
        subtitle={String(yearNumber)}
        filename={reportFilename("yearly", String(yearNumber))}
      >
        <Space wrap>
          <DatePicker
            picker="year"
            value={year}
            onChange={(value) => value && setYear(value)}
            allowClear={false}
            inputReadOnly
          />
          <Button onClick={() => setYear(year.subtract(1, "year"))}>
            Previous
          </Button>
          <Button
            onClick={() => setYear(year.add(1, "year"))}
            disabled={year.isSame(dayjs(), "year")}
          >
            Next
          </Button>
        </Space>
      </ReportToolbar>

      <Row gutter={[12, 12]}>
        <Col xs={12} md={12}>
          <Card size="small">
            <Statistic
              title="Monthly average expense"
              value={report.totals.expense / 12}
              precision={0}
              formatter={(value) => formatMoney(Number(value), user.currency)}
            />
          </Card>
        </Col>
        <Col xs={12} md={12}>
          <Card size="small">
            <Statistic
              title="Best month"
              value={best && best.balance !== 0 ? best.label : "—"}
              styles={{ content: { fontSize: 18 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Month by month">
        <IncomeExpenseBars
          data={report.series}
          currency={user.currency}
          height={300}
        />
      </Card>

      <ReportBody
        heading={`Year ${yearNumber}`}
        totals={report.totals}
        transactions={report.transactions}
        expenseByCategory={report.expenseByCategory}
        incomeByCategory={report.incomeByCategory}
      />
    </Space>
  );
}

/* ------------------------------ Category -------------------------------- */

export function CategoryReportView() {
  const { transactions, user, loading } = useWorkspace();
  const [type, setType] = useState<TxType>("expense");
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const data = useMemo(() => {
    const fromKey = toDateKey(range[0].toDate());
    const toKey = toDateKey(range[1].toDate());
    const rows = inRange(transactions, fromKey, toKey);
    const typed = rows.filter((tx) => tx.type === type);

    return {
      fromKey,
      toKey,
      rows: sortByDateDesc(typed),
      totals: totalsOf(typed),
      breakdown: categoryBreakdown(rows, type),
    };
  }, [transactions, range, type]);

  if (loading) return <MiniLoader label="Loading your records" />;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <ReportToolbar
        transactions={data.rows}
        totals={data.totals}
        title="Category report"
        subtitle={`${type === "income" ? "Income" : "Expense"} · ${data.fromKey} to ${data.toKey}`}
        filename={reportFilename("category", type, data.fromKey, data.toKey)}
      >
        <Space wrap>
          <RangePicker
            value={range}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) setRange([value[0], value[1]]);
            }}
            allowClear={false}
            format="DD MMM YYYY"
            inputReadOnly
            presets={[
              {
                label: "This month",
                value: [dayjs().startOf("month"), dayjs().endOf("month")],
              },
              {
                label: "This year",
                value: [dayjs().startOf("year"), dayjs().endOf("year")],
              },
            ]}
          />
          <Segmented<TxType>
            value={type}
            onChange={setType}
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
          />
        </Space>
      </ReportToolbar>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={10}>
          <Card title="Share of total">
            <CategoryDonut
              data={data.breakdown}
              currency={user.currency}
              height={280}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Amount and contribution">
            <CategoryTable
              data={data.breakdown}
              currency={user.currency}
              emptyText={`No ${type} in this period`}
            />
          </Card>
        </Col>
      </Row>

      <Typography.Text type="secondary" className="text-xs">
        {data.breakdown.length} categor
        {data.breakdown.length === 1 ? "y" : "ies"} across {data.rows.length}{" "}
        transactions.
      </Typography.Text>
    </Space>
  );
}

/* ------------------------------- Custom --------------------------------- */

export function CustomReportView() {
  const { transactions, user, loading } = useWorkspace();
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);

  const fromKey = toDateKey(range[0].toDate());
  const toKey = toDateKey(range[1].toDate());

  const report = useMemo(
    () => customReport(transactions, fromKey, toKey),
    [transactions, fromKey, toKey],
  );

  if (loading) return <MiniLoader label="Loading your records" />;

  const days = range[1].diff(range[0], "day") + 1;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <ReportToolbar
        transactions={report.transactions}
        totals={report.totals}
        title="Custom report"
        subtitle={`${fromKey} to ${toKey}`}
        filename={reportFilename("custom", fromKey, toKey)}
      >
        <RangePicker
          value={range}
          onChange={(value) => {
            if (value?.[0] && value?.[1]) setRange([value[0], value[1]]);
          }}
          allowClear={false}
          format="DD MMM YYYY"
          inputReadOnly
          style={{ maxWidth: 320, width: "100%" }}
          presets={[
            { label: "Last 7 days", value: [dayjs().subtract(6, "day"), dayjs()] },
            { label: "Last 30 days", value: [dayjs().subtract(29, "day"), dayjs()] },
            { label: "Last 90 days", value: [dayjs().subtract(89, "day"), dayjs()] },
            {
              label: "This month",
              value: [dayjs().startOf("month"), dayjs().endOf("month")],
            },
            {
              label: "This year",
              value: [dayjs().startOf("year"), dayjs().endOf("year")],
            },
          ]}
        />
      </ReportToolbar>

      <Row gutter={[12, 12]}>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Days in range" value={days} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Average daily expense"
              value={report.totals.expense / days}
              precision={0}
              formatter={(value) => formatMoney(Number(value), user.currency)}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Transactions"
              value={report.transactions.length}
            />
          </Card>
        </Col>
      </Row>

      <ReportBody
        heading={`${formatDate(fromKey)} — ${formatDate(toKey)}`}
        totals={report.totals}
        transactions={report.transactions}
        expenseByCategory={report.expenseByCategory}
        incomeByCategory={report.incomeByCategory}
        chart={
          <BalanceTrend
            data={report.series}
            currency={user.currency}
            height={280}
          />
        }
      />
    </Space>
  );
}
