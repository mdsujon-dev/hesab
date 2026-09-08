"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { Totals } from "@/lib/types";
import { currencySymbol } from "@/lib/money";
import { EXPENSE, GOLD, INCOME } from "@/components/providers/theme-provider";

/**
 * Income / expense / balance tiles. Two columns on phones so the numbers stay
 * legible without horizontal scrolling, three from `md` up.
 */
export function SummaryCards({
  totals,
  currency,
  title,
  loading = false,
}: {
  totals: Totals;
  currency: string;
  title?: string;
  loading?: boolean;
}) {
  const symbol = currencySymbol(currency);
  const negative = totals.balance < 0;

  const tiles = [
    {
      key: "income",
      label: title ? `${title} income` : "Income",
      value: totals.income,
      color: INCOME,
      icon: <ArrowUpOutlined />,
      span: { xs: 12, md: 8 },
    },
    {
      key: "expense",
      label: title ? `${title} expense` : "Expense",
      value: totals.expense,
      color: EXPENSE,
      icon: <ArrowDownOutlined />,
      span: { xs: 12, md: 8 },
    },
    {
      key: "balance",
      label: title ? `${title} balance` : "Balance",
      value: totals.balance,
      color: negative ? EXPENSE : GOLD,
      icon: <WalletOutlined />,
      span: { xs: 24, md: 8 },
    },
  ];

  return (
    <Row gutter={[12, 12]}>
      {tiles.map((tile) => (
        <Col key={tile.key} {...tile.span}>
          <Card
            variant="outlined"
            size="small"
            styles={{ body: { padding: 16 } }}
            style={{
              height: "100%",
              // A hairline of the tile's own colour along the top edge.
              backgroundImage: `linear-gradient(180deg, ${tile.color}14 0%, transparent 46%)`,
              borderTop: `2px solid ${tile.color}`,
            }}
          >
            <Statistic
              title={
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-70">
                  <span
                    aria-hidden
                    className="inline-flex size-5 items-center justify-center rounded"
                    style={{
                      background: `${tile.color}1f`,
                      color: tile.color,
                      fontSize: 10,
                    }}
                  >
                    {tile.icon}
                  </span>
                  {tile.label}
                </span>
              }
              value={tile.value}
              precision={2}
              prefix={symbol}
              loading={loading}
              styles={{ content: {
                color: tile.color,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                wordBreak: "break-word",
              } }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
