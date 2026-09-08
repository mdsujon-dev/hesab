"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FallOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  SettingOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import Link from "next/link";

/** Single source of truth for the sidebar and the mobile drawer. */
export const NAV_ITEMS: MenuProps["items"] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: "/income",
    icon: <RiseOutlined />,
    label: <Link href="/income">Income</Link>,
  },
  {
    key: "/expense",
    icon: <FallOutlined />,
    label: <Link href="/expense">Expense</Link>,
  },
  {
    key: "/transactions",
    icon: <SwapOutlined />,
    label: <Link href="/transactions">Transactions</Link>,
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    label: "Reports",
    children: [
      {
        key: "/reports/daily",
        icon: <CalendarOutlined />,
        label: <Link href="/reports/daily">Daily</Link>,
      },
      {
        key: "/reports/monthly",
        icon: <LineChartOutlined />,
        label: <Link href="/reports/monthly">Monthly</Link>,
      },
      {
        key: "/reports/yearly",
        icon: <BarChartOutlined />,
        label: <Link href="/reports/yearly">Yearly</Link>,
      },
      {
        key: "/reports/category",
        icon: <PieChartOutlined />,
        label: <Link href="/reports/category">Category</Link>,
      },
      {
        key: "/reports/custom",
        icon: <AppstoreOutlined />,
        label: <Link href="/reports/custom">Custom range</Link>,
      },
    ],
  },
  {
    key: "/categories",
    icon: <TagsOutlined />,
    label: <Link href="/categories">Categories</Link>,
  },
  { type: "divider" },
  {
    key: "/profile",
    icon: <UserOutlined />,
    label: <Link href="/profile">Profile</Link>,
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: <Link href="/settings">Settings</Link>,
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/income": "Income",
  "/expense": "Expense",
  "/transactions": "Transactions",
  "/reports/daily": "Daily report",
  "/reports/monthly": "Monthly report",
  "/reports/yearly": "Yearly report",
  "/reports/category": "Category report",
  "/reports/custom": "Custom report",
  "/categories": "Categories",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function openKeysFor(pathname: string) {
  return pathname.startsWith("/reports") ? ["reports"] : [];
}
