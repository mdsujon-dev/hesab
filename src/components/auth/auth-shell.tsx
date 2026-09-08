"use client";

import { Logo } from "@/components/ui/logo";
import { Typography } from "antd";
import {
  CloudSyncOutlined,
  LineChartOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { GOLD } from "@/components/providers/theme-provider";

const HIGHLIGHTS = [
  {
    icon: <ThunderboltOutlined />,
    title: "Works offline",
    body: "Add income and expenses with no connection. Nothing waits on the network.",
  },
  {
    icon: <CloudSyncOutlined />,
    title: "Syncs by itself",
    body: "The moment you are back online, everything uploads in the background.",
  },
  {
    icon: <LineChartOutlined />,
    title: "Real reporting",
    body: "Daily, monthly, yearly and custom ranges, with PDF and Excel export.",
  },
  {
    icon: <LockOutlined />,
    title: "Private workspace",
    body: "Your books are scoped to your account and never shared with anyone.",
  },
];

/**
 * Split layout: a brand panel that only appears once there is room for it
 * (lg and up), and the form column which is the whole screen on phones.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          background:
            "radial-gradient(900px 520px at 10% -8%, #fdf4dc 0%, transparent 62%), linear-gradient(165deg, #fbfbfc 0%, #f3f4f7 100%)",
          borderInlineEnd: "1px solid #e9ebf0",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 size-[420px] rounded-full opacity-[0.16]"
          style={{
            background: "radial-gradient(circle, #d4af37, transparent 64%)",
          }}
        />

        <div className="relative flex items-center">
          <Logo height={62} priority />
        </div>

        <div className="relative max-w-lg">
          <Typography.Title
            level={2}
            style={{ margin: 0, fontSize: 38, lineHeight: 1.2, fontWeight: 700 }}
          >
            Every taka,
            <br />
            <span className="gold-text">accounted for.</span>
          </Typography.Title>

          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 16, fontSize: 16, maxWidth: 460 }}
          >
            A private accounting workspace that keeps working when your
            connection does not — and catches up the moment it returns.
          </Typography.Paragraph>

          <div className="mt-9 grid grid-cols-2 gap-x-7 gap-y-6">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title}>
                <span
                  className="mb-2 inline-flex size-9 items-center justify-center rounded-lg"
                  style={{
                    background: "#fdf7e6",
                    border: "1px solid #f0e2b8",
                    color: GOLD,
                  }}
                >
                  {item.icon}
                </span>
                <p className="m-0 text-sm font-semibold">{item.title}</p>
                <p className="m-0 mt-1 text-[13px] leading-relaxed opacity-60">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative m-0 text-xs opacity-45">
          Offline-first accounting · Built for mobile and desktop
        </p>
      </aside>

      <main
        className="flex items-center justify-center px-4 py-10 safe-top safe-bottom"
        style={{ background: "#ffffff" }}
      >
        <div className="rise w-full max-w-[460px]">{children}</div>
      </main>
    </div>
  );
}

/** Brand lockup above the form (phones only, where the aside is hidden). */
export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-7">
      <div className="mb-6 lg:hidden">
        <Logo height={50} priority />
      </div>

      <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{subtitle}</Typography.Text>
    </div>
  );
}
