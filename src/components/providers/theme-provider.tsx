"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";

/**
 * Single light theme — the app has no dark mode.
 *
 * Gold is the accent. On white it needs to be deepened before it carries text
 * or icons (the bright brand gold sits around 1.8:1 on white, which is
 * unreadable), so GOLD is the deeper working tone and GOLD_BRIGHT is kept for
 * fills and gradients only.
 */
export const GOLD = "#b8901f";
export const GOLD_BRIGHT = "#d4af37";
export const GOLD_HOVER = "#cba52c";
export const GOLD_ACTIVE = "#96741a";
export const GOLD_SOFT = "#fdf7e6";
/** Text/icon colour that sits on a gold fill. */
export const ON_GOLD = "#241c05";

export const INCOME = "#0f9d6f";
export const EXPENSE = "#dc2f45";

export const PAGE_BG = "#f6f7f9";
export const SURFACE = "#ffffff";
export const BORDER = "#e6e8ee";
export const TEXT = "#1f2430";
export const TEXT_SECONDARY = "#5b6474";

const theme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: GOLD,
    colorSuccess: INCOME,
    colorError: EXPENSE,
    colorWarning: "#c07d10",
    colorInfo: GOLD,
    colorLink: GOLD,
    colorLinkHover: GOLD_HOVER,

    // 7px corners on inputs and buttons; the rest of the scale follows.
    borderRadius: 7,
    borderRadiusLG: 10,
    borderRadiusSM: 5,
    borderRadiusXS: 4,

    colorBgBase: SURFACE,
    colorBgLayout: PAGE_BG,
    colorBgContainer: SURFACE,
    colorBgElevated: SURFACE,
    colorBorder: BORDER,
    colorBorderSecondary: "#eef0f4",

    colorText: TEXT,
    colorTextSecondary: TEXT_SECONDARY,
    colorTextTertiary: "#8a93a4",
    colorTextQuaternary: "#aab1bf",

    fontFamily:
      "var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    controlHeight: 36,
    wireframe: false,
    // Barely-there shadows: surfaces are separated by their border, with just
    // enough lift to stop the page reading as flat paper.
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
    boxShadowSecondary:
      "0 4px 14px rgba(16, 24, 40, 0.07), 0 1px 2px rgba(16, 24, 40, 0.04)",
    boxShadowTertiary: "0 1px 2px rgba(16, 24, 40, 0.03)",
  },
  components: {
    Layout: {
      siderBg: SURFACE,
      headerBg: "rgba(255, 255, 255, 0.86)",
      bodyBg: PAGE_BG,
      headerPadding: 0,
      headerHeight: 60,
      triggerBg: "#f1f2f6",
      triggerColor: TEXT_SECONDARY,
    },
    Menu: {
      itemBorderRadius: 7,
      itemMarginInline: 10,
      itemHeight: 42,
      itemBg: "transparent",
      subMenuItemBg: "transparent",
      itemSelectedBg: GOLD_SOFT,
      itemSelectedColor: GOLD,
      itemHoverBg: "#f3f4f7",
      itemColor: TEXT_SECONDARY,
    },
    Button: {
      // Near-black label on the gold fill.
      primaryColor: ON_GOLD,
      colorPrimaryHover: GOLD_HOVER,
      colorPrimaryActive: GOLD_ACTIVE,
      fontWeight: 600,
      primaryShadow: "0 1px 2px rgba(184, 144, 31, 0.16)",
      defaultShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
      dangerShadow: "none",
      defaultBorderColor: "#dfe2e9",
      controlHeight: 36,
      controlHeightLG: 42,
    },
    Card: {
      colorBgContainer: SURFACE,
      headerBg: "transparent",
      headerFontSize: 15,
      paddingLG: 18,
      // Border carries the separation; the shadow is only a hint of lift.
      boxShadowTertiary: "0 1px 2px rgba(16, 24, 40, 0.03)",
    },
    Input: {
      controlHeight: 36,
      controlHeightLG: 42,
      activeShadow: "0 0 0 3px rgba(184, 144, 31, 0.12)",
      colorBgContainer: "#fcfcfd",
      hoverBorderColor: "#cfa93a",
    },
    InputNumber: {
      controlHeight: 36,
      controlHeightLG: 42,
      activeShadow: "0 0 0 3px rgba(184, 144, 31, 0.12)",
      colorBgContainer: "#fcfcfd",
    },
    Select: {
      controlHeight: 36,
      controlHeightLG: 42,
      colorBgContainer: "#fcfcfd",
      optionSelectedBg: GOLD_SOFT,
      optionSelectedColor: GOLD,
    },
    DatePicker: {
      controlHeight: 36,
      controlHeightLG: 42,
      colorBgContainer: "#fcfcfd",
      activeShadow: "0 0 0 3px rgba(184, 144, 31, 0.12)",
    },
    Table: {
      headerBg: "#fafbfc",
      headerColor: TEXT_SECONDARY,
      headerSplitColor: "transparent",
      rowHoverBg: "#fbfaf5",
      borderColor: "#eef0f4",
      cellPaddingBlock: 12,
      cellPaddingBlockSM: 10,
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 22,
    },
    Segmented: {
      itemSelectedBg: SURFACE,
      itemSelectedColor: GOLD,
      trackBg: "#f1f2f6",
      borderRadius: 7,
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Tabs: {
      itemSelectedColor: GOLD,
      inkBarColor: GOLD,
    },
    Progress: {
      defaultColor: GOLD,
      remainingColor: "#eef0f4",
    },
    Alert: {
      borderRadiusLG: 8,
    },
    Pagination: {
      itemActiveBg: GOLD_SOFT,
    },
    Dropdown: {
      controlItemBgHover: "#f3f4f7",
    },
    Spin: {
      dotSize: 18,
    },
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
