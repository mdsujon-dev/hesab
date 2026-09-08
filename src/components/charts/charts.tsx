"use client";

import { Empty, theme } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategorySlice, SeriesPoint } from "@/lib/reports";
import { formatCompact, formatMoney } from "@/lib/money";

const INCOME = "#0f9d6f";
const EXPENSE = "#dc2f45";

/**
 * Tuned for the dark ground: gold leads, then hues spaced far enough apart to
 * stay tellable at small sizes without any of them fighting the gold.
 */
const CATEGORY_COLORS = [
  "#b8901f",
  "#0ea5e9",
  "#0f9d6f",
  "#db2777",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
  "#dc2f45",
  "#4f46e5",
];

function useChartTheme() {
  const { token } = theme.useToken();
  return {
    grid: token.colorBorderSecondary,
    axis: token.colorTextTertiary,
    tooltip: {
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadius,
      color: token.colorText,
      fontSize: 13,
      boxShadow: token.boxShadowSecondary,
      padding: "8px 12px",
    } as React.CSSProperties,
  };
}

function NoData({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No data for this period"
      />
    </div>
  );
}

export function IncomeExpenseBars({
  data,
  currency,
  height = 260,
}: {
  data: SeriesPoint[];
  currency: string;
  height?: number;
}) {
  const chart = useChartTheme();
  const hasData = data.some((point) => point.income > 0 || point.expense > 0);
  if (!hasData) return <NoData height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="2 6"
          stroke={chart.grid}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: chart.axis }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: chart.axis }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCompact(value)}
          width={56}
        />
        <Tooltip
          contentStyle={chart.tooltip}
          cursor={{ fill: "rgba(184,144,31,0.08)" }}
          formatter={(value, name) => [
            formatMoney(Number(value ?? 0), currency),
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill={INCOME} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill={EXPENSE} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BalanceTrend({
  data,
  currency,
  height = 240,
}: {
  data: SeriesPoint[];
  currency: string;
  height?: number;
}) {
  const chart = useChartTheme();
  const hasData = data.some((point) => point.income > 0 || point.expense > 0);
  if (!hasData) return <NoData height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="2 6"
          stroke={chart.grid}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: chart.axis }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: chart.axis }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCompact(value)}
          width={56}
        />
        <Tooltip
          contentStyle={chart.tooltip}
          formatter={(value, name) => [
            formatMoney(Number(value ?? 0), currency),
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke={INCOME}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke={EXPENSE}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
  currency,
  height = 260,
}: {
  data: CategorySlice[];
  currency: string;
  height?: number;
}) {
  const chart = useChartTheme();
  if (data.length === 0) return <NoData height={height} />;

  // Keep the legend readable: show the top slices, group the rest.
  const top = data.slice(0, 8);
  const rest = data.slice(8);
  const slices =
    rest.length > 0
      ? [
          ...top,
          {
            categoryId: "other",
            categoryName: `Other (${rest.length})`,
            amount: rest.reduce((sum, slice) => sum + slice.amount, 0),
            percentage: rest.reduce((sum, slice) => sum + slice.percentage, 0),
            count: rest.reduce((sum, slice) => sum + slice.count, 0),
          },
        ]
      : top;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={slices}
          dataKey="amount"
          nameKey="categoryName"
          innerRadius="52%"
          outerRadius="78%"
          paddingAngle={2}
          stroke="none"
        >
          {slices.map((slice, index) => (
            <Cell
              key={slice.categoryId ?? slice.categoryName}
              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chart.tooltip}
          formatter={(value, name) => [
            formatMoney(Number(value ?? 0), currency),
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { CATEGORY_COLORS };
