"use client";

import { Collapse, Tag, Typography } from "antd";
import {
  CloudSyncOutlined,
  DownloadOutlined,
  MobileOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
  SafetyOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Card } from "@/components/ui/card";
import { GOLD, GOLD_SOFT } from "@/components/providers/theme-provider";

/**
 * How the app works, in the app.
 *
 * Collapsed by default and grouped by task, so it answers a question without
 * turning Settings into a wall of text.
 */
const SECTIONS = [
  {
    key: "start",
    icon: <PlusCircleOutlined />,
    label: "Recording income and expenses",
    body: [
      "Use Add income or Add expense on the Dashboard, or the + button in the bottom bar on a phone. Both open the same short form.",
      "Amount and category are required; the note and payment method are optional but make later reports far more useful.",
      "To change or remove an entry, open the ⋮ menu at the end of its row in any table.",
    ],
  },
  {
    key: "offline",
    icon: <CloudSyncOutlined />,
    label: "Working offline",
    body: [
      "The app keeps a full copy of your records on the device, so every screen works with no connection.",
      "Anything you add offline is saved immediately and marked as waiting to sync. The chip in the top bar shows Synced, N pending, Offline or Retrying.",
      "As soon as the connection returns, pending entries upload on their own — there is nothing to press.",
      "Signing out clears the local copy from that device, so sync before you sign out if something is still pending.",
    ],
  },
  {
    key: "categories",
    icon: <TagsOutlined />,
    label: "Categories",
    body: [
      "A starter set is created with your account. Add your own from the Categories page — each one belongs to either income or expense.",
      "Deleting a category keeps the transactions that used it; they simply show the name as it was recorded.",
    ],
  },
  {
    key: "reports",
    icon: <PieChartOutlined />,
    label: "Reports",
    body: [
      "Daily, Monthly, Yearly and Custom range each show totals, a category split and the underlying transactions.",
      "The Category report answers 'where did it go' — every category with its share of the total for the period you pick.",
      "Reports are calculated from your own records, so they work offline too.",
    ],
  },
  {
    key: "export",
    icon: <DownloadOutlined />,
    label: "Exporting and printing",
    body: [
      "Export appears on the transaction and report screens. It covers the whole selected period, not just the visible page.",
      "PDF is for sharing or filing, CSV opens in Excel and Google Sheets, and Print uses your browser's print dialog (choose 'Save as PDF' there if you prefer).",
    ],
  },
  {
    key: "install",
    icon: <MobileOutlined />,
    label: "Installing on your phone",
    body: [
      "On Android or desktop Chrome, open the browser menu and choose Install app.",
      "On iPhone, tap Share and then Add to Home Screen.",
      "Once installed it opens full screen and keeps working without a connection.",
    ],
  },
  {
    key: "security",
    icon: <SafetyOutlined />,
    label: "Your data and account",
    body: [
      "Your workspace is private to your account — every request is checked on the server against your session.",
      "Change your password from Profile. If you forget it, use 'Forgot password?' on the sign-in page and we email you a link.",
      "Deleting your account permanently removes every transaction and category. It cannot be undone.",
    ],
  },
];

export function UserGuide() {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          User guide
          <Tag
            variant="filled"
            style={{ background: GOLD_SOFT, color: GOLD, border: "none" }}
          >
            How it works
          </Tag>
        </span>
      }
      styles={{ body: { paddingTop: 4 } }}
    >
      <Typography.Paragraph type="secondary" className="!mb-3 text-sm">
        Short answers to the things people ask most. Open a section to read it.
      </Typography.Paragraph>

      <Collapse
        accordion
        bordered={false}
        style={{ background: "transparent" }}
        items={SECTIONS.map((section) => ({
          key: section.key,
          label: (
            <span className="flex items-center gap-2 font-medium">
              <span style={{ color: GOLD }}>{section.icon}</span>
              {section.label}
            </span>
          ),
          children: (
            <ul className="m-0 ps-5 text-sm leading-relaxed opacity-75">
              {section.body.map((line) => (
                <li key={line} className="mb-1.5">
                  {line}
                </li>
              ))}
            </ul>
          ),
        }))}
      />
    </Card>
  );
}
