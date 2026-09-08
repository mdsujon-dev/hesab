"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  App as AntApp,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SettingOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { NAV_ITEMS, PAGE_TITLES, openKeysFor } from "@/components/shell/nav";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Button as AppButton } from "@/components/ui/button";
import { SyncStatus } from "@/components/shell/sync-status";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { GOLD, ON_GOLD } from "@/components/providers/theme-provider";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import type { TxType } from "@/lib/types";

const { Header, Sider, Content } = Layout;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const { user, signOut } = useWorkspace();
  const { modal } = AntApp.useApp();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [quickAdd, setQuickAdd] = useState<TxType | null>(null);

  // lg is the breakpoint where the persistent sidebar replaces the drawer.
  const isDesktop = screens.lg ?? false;

  const title = useMemo(() => {
    const match = Object.keys(PAGE_TITLES)
      .filter((key) => pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_TITLES[match] : "Hesab";
  }, [pathname]);

  const renderMenu = (onSelect?: () => void) => (
    <Menu
      mode="inline"
      items={NAV_ITEMS}
      selectedKeys={[pathname]}
      defaultOpenKeys={openKeysFor(pathname)}
      onClick={onSelect}
      style={{ borderInlineEnd: "none", background: "transparent" }}
    />
  );

  const confirmSignOut = () => {
    modal.confirm({
      title: "Sign out?",
      content:
        "Any changes still waiting to sync will be removed from this device.",
      okText: "Sign out",
      okButtonProps: { danger: true },
      onOk: () => signOut(),
    });
  };

  return (
    <Layout hasSider={isDesktop} style={{ minHeight: "100dvh" }}>
      {isDesktop ? (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          // The built-in trigger is pinned to the bottom of the Sider, which is
          // where sign-out belongs; this renders our own above it instead.
          trigger={null}
          width={244}
          theme="light"
          className="no-print"
          style={{
            position: "sticky",
            top: 0,
            height: "100dvh",
            borderInlineEnd: "1px solid #e9ebf0",
          }}
        >
          <div className="flex h-full flex-col">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 px-4 py-5 no-underline"
            >
              {collapsed ? <LogoMark size={34} /> : <Logo height={42} priority />}
            </Link>

            <div className="gold-rule mx-4 mb-3 shrink-0" />

            {/* no-scrollbar: the nav scrolls but never shows a scrollbar. */}
            <div className="no-scrollbar flex-1 overflow-y-auto">
              {renderMenu()}
            </div>

            <div
              className="shrink-0 px-2 py-2"
              style={{ borderTop: "1px solid #f0f1f5" }}
            >
              <AppButton
                tone="quiet"
                block
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={
                  collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                }
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  height: 40,
                }}
              >
                {collapsed ? null : "Collapse"}
              </AppButton>

              {/* Last item in the column, so it sits at the very bottom. */}
              <AppButton
                danger
                tone="quiet"
                block
                icon={<LogoutOutlined />}
                onClick={confirmSignOut}
                style={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  height: 42,
                  fontWeight: 500,
                }}
              >
                {collapsed ? null : "Sign out"}
              </AppButton>
            </div>
          </div>
        </Sider>
      ) : null}

      <Layout>
        <Header
          className="no-print safe-top"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingInline: 14,
            height: "auto",
            minHeight: 60,
            lineHeight: "normal",
            borderBottom: "1px solid #e9ebf0",
            backdropFilter: "blur(12px)",
          }}
        >
          {isDesktop ? null : (
            <Button
              type="text"
              aria-label="Open menu"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
          )}

          <Typography.Title
            level={5}
            ellipsis
            style={{ margin: 0, flex: 1, minWidth: 0, fontWeight: 600 }}
          >
            {title}
          </Typography.Title>

          {isDesktop ? <SyncStatus /> : <SyncStatus compact />}

          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "who",
                  label: (
                    <div className="py-1">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs opacity-60">{user.email}</div>
                    </div>
                  ),
                  disabled: true,
                },
                { type: "divider" },
                {
                  key: "profile",
                  icon: <UserOutlined />,
                  label: "Profile",
                  onClick: () => router.push("/profile"),
                },
                {
                  key: "settings",
                  icon: <SettingOutlined />,
                  label: "Settings",
                  onClick: () => router.push("/settings"),
                },
                { type: "divider" },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Sign out",
                  danger: true,
                  onClick: confirmSignOut,
                },
              ],
            }}
          >
            <Avatar
              size={34}
              style={{
                background: "linear-gradient(135deg, #d4af37, #a8801f)",
                color: ON_GOLD,
                cursor: "pointer",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
          </Dropdown>
        </Header>

        <Content
          className={isDesktop ? "p-5 xl:p-7" : "p-3 pb-nav"}
          style={{ maxWidth: 1400, width: "100%", margin: "0 auto" }}
        >
          {children}
        </Content>
      </Layout>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        size={278}
        styles={{
          body: { padding: 0, display: "flex", flexDirection: "column" },
          header: { borderBottom: "none" },
        }}
        title={<Logo height={38} />}
      >
        <div className="gold-rule mx-4 mb-2" />
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            {renderMenu(() => setDrawerOpen(false))}
          </div>
          <div
            className="safe-bottom px-2 py-2"
            style={{ borderTop: "1px solid #f0f1f5" }}
          >
            <AppButton
              danger
              tone="quiet"
              block
              icon={<LogoutOutlined />}
              onClick={() => {
                setDrawerOpen(false);
                confirmSignOut();
              }}
              style={{ justifyContent: "flex-start", height: 44 }}
            >
              Sign out
            </AppButton>
          </div>
        </div>
      </Drawer>

      {isDesktop ? null : (
        <MobileTabBar
          pathname={pathname}
          onAdd={() => setQuickAdd("expense")}
          onMore={() => setDrawerOpen(true)}
        />
      )}

      <TransactionModal
        open={quickAdd !== null}
        type={quickAdd ?? "expense"}
        onClose={() => setQuickAdd(null)}
        allowTypeSwitch
      />
    </Layout>
  );
}

/** Thumb-reachable navigation for phones, with a centre quick-add button. */
function MobileTabBar({
  pathname,
  onAdd,
  onMore,
}: {
  pathname: string;
  onAdd: () => void;
  onMore: () => void;
}) {
  const items = [
    { href: "/dashboard", icon: <DashboardOutlined />, label: "Home" },
    { href: "/transactions", icon: <SwapOutlined />, label: "History" },
    null,
    { href: "/reports/monthly", icon: <BarChartOutlined />, label: "Reports" },
  ];

  const tabStyle = (active: boolean) => ({
    color: active ? GOLD : "#8a93a4",
  });

  return (
    <nav
      className="no-print safe-bottom fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around px-1 pt-1"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid #e9ebf0",
      }}
      aria-label="Primary"
    >
      {items.map((item, index) =>
        item ? (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] no-underline"
            style={tabStyle(pathname.startsWith(item.href))}
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ) : (
          <div
            key={`add-${index}`}
            className="flex flex-1 items-center justify-center"
          >
            <button
              onClick={onAdd}
              aria-label="Add transaction"
              className="flex cursor-pointer items-center justify-center rounded-full border-0"
              style={{
                width: 54,
                height: 54,
                transform: "translateY(-12px)",
                background: "linear-gradient(135deg, #e0c15c, #b8901f)",
                color: ON_GOLD,
                fontSize: 22,
                boxShadow: "0 6px 16px rgba(184, 144, 31, 0.30)",
              }}
            >
              <PlusOutlined />
            </button>
          </div>
        ),
      )}
      <button
        onClick={onMore}
        className="flex min-h-[58px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent text-[11px]"
        style={tabStyle(false)}
        aria-label="More"
      >
        <span className="text-lg leading-none">
          <MenuOutlined />
        </span>
        More
      </button>
    </nav>
  );
}
