import type { Transaction, Totals, TxType } from "@/lib/types";
import {
  MONTH_NAMES,
  daysInMonth,
  toDateKey,
  totalsOf,
} from "@/lib/utils";

/**
 * Report calculations run over a plain array of transactions, so the exact same
 * code serves the MongoDB-backed API routes and the offline IndexedDB mirror.
 */

export type CategorySlice = {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
};

export type SeriesPoint = {
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export function inRange(
  transactions: Transaction[],
  fromKey: string,
  toKey: string,
) {
  return transactions.filter((tx) => {
    if (tx.deletedAt) return false;
    const key = toDateKey(tx.date);
    return key >= fromKey && key <= toKey;
  });
}

export function categoryBreakdown(
  transactions: Transaction[],
  type: TxType,
): CategorySlice[] {
  const buckets = new Map<string, CategorySlice>();
  let total = 0;

  for (const tx of transactions) {
    if (tx.deletedAt || tx.type !== type) continue;
    const key = tx.categoryId ?? `name:${tx.categoryName ?? "Uncategorized"}`;
    const existing = buckets.get(key);
    total += tx.amount;
    if (existing) {
      existing.amount += tx.amount;
      existing.count += 1;
    } else {
      buckets.set(key, {
        categoryId: tx.categoryId ?? null,
        categoryName: tx.categoryName ?? "Uncategorized",
        amount: tx.amount,
        percentage: 0,
        count: 1,
      });
    }
  }

  return [...buckets.values()]
    .map((slice) => ({
      ...slice,
      percentage: total > 0 ? (slice.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function dailyReport(transactions: Transaction[], dateKey: string) {
  const rows = inRange(transactions, dateKey, dateKey);
  return {
    dateKey,
    totals: totalsOf(rows),
    transactions: sortByDateDesc(rows),
    expenseByCategory: categoryBreakdown(rows, "expense"),
    incomeByCategory: categoryBreakdown(rows, "income"),
  };
}

export function monthlyReport(
  transactions: Transaction[],
  year: number,
  month1: number,
) {
  const days = daysInMonth(year, month1);
  const monthPrefix = `${year}-${`${month1}`.padStart(2, "0")}`;
  const rows = inRange(
    transactions,
    `${monthPrefix}-01`,
    `${monthPrefix}-${`${days}`.padStart(2, "0")}`,
  );

  const series: SeriesPoint[] = [];
  for (let day = 1; day <= days; day += 1) {
    const key = `${monthPrefix}-${`${day}`.padStart(2, "0")}`;
    const dayRows = rows.filter((tx) => toDateKey(tx.date) === key);
    const totals = totalsOf(dayRows);
    series.push({
      label: `${day}`,
      income: totals.income,
      expense: totals.expense,
      balance: totals.balance,
    });
  }

  return {
    year,
    month: month1,
    label: `${MONTH_NAMES[month1 - 1]} ${year}`,
    totals: totalsOf(rows),
    series,
    transactions: sortByDateDesc(rows),
    expenseByCategory: categoryBreakdown(rows, "expense"),
    incomeByCategory: categoryBreakdown(rows, "income"),
  };
}

export function yearlyReport(transactions: Transaction[], year: number) {
  const rows = inRange(transactions, `${year}-01-01`, `${year}-12-31`);

  const series: SeriesPoint[] = MONTH_NAMES.map((name, index) => {
    const prefix = `${year}-${`${index + 1}`.padStart(2, "0")}`;
    const monthRows = rows.filter((tx) => toDateKey(tx.date).startsWith(prefix));
    const totals = totalsOf(monthRows);
    return {
      label: name,
      income: totals.income,
      expense: totals.expense,
      balance: totals.balance,
    };
  });

  return {
    year,
    totals: totalsOf(rows),
    series,
    transactions: sortByDateDesc(rows),
    expenseByCategory: categoryBreakdown(rows, "expense"),
    incomeByCategory: categoryBreakdown(rows, "income"),
  };
}

export function customReport(
  transactions: Transaction[],
  fromKey: string,
  toKey: string,
) {
  const rows = inRange(transactions, fromKey, toKey);
  return {
    fromKey,
    toKey,
    totals: totalsOf(rows),
    series: bucketByDay(rows, fromKey, toKey),
    transactions: sortByDateDesc(rows),
    expenseByCategory: categoryBreakdown(rows, "expense"),
    incomeByCategory: categoryBreakdown(rows, "income"),
  };
}

/** Day buckets, collapsing to months when the range is longer than ~2 months. */
export function bucketByDay(
  transactions: Transaction[],
  fromKey: string,
  toKey: string,
): SeriesPoint[] {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  const dayCount =
    Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;

  if (dayCount <= 0) return [];

  if (dayCount > 62) {
    const months = new Map<string, Totals>();
    for (const tx of transactions) {
      const key = toDateKey(tx.date).slice(0, 7);
      const bucket = months.get(key) ?? { income: 0, expense: 0, balance: 0 };
      if (tx.type === "income") bucket.income += tx.amount;
      else bucket.expense += tx.amount;
      bucket.balance = bucket.income - bucket.expense;
      months.set(key, bucket);
    }
    return [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, totals]) => ({ label: key, ...totals }));
  }

  const points: SeriesPoint[] = [];
  for (let i = 0; i < dayCount; i += 1) {
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const key = toDateKey(cursor);
    const dayRows = transactions.filter((tx) => toDateKey(tx.date) === key);
    const totals = totalsOf(dayRows);
    points.push({ label: key.slice(5), ...totals });
  }
  return points;
}

export function sortByDateDesc(transactions: Transaction[]) {
  return [...transactions].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
