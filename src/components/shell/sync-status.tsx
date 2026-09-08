"use client";

import { Badge, Button, Popover, Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { formatDateTime } from "@/lib/utils";

/** Compact chip in the header; the popover explains what is happening. */
export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const { sync, online, syncNow } = useWorkspace();

  const view = !online
    ? {
        color: "warning" as const,
        icon: <DisconnectOutlined />,
        label: "Offline",
        detail:
          "You are offline. New entries are saved on this device and will sync automatically when the connection returns.",
      }
    : sync.status === "syncing"
      ? {
          color: "processing" as const,
          icon: <SyncOutlined spin />,
          label: "Syncing",
          detail: "Sending your changes to the server.",
        }
      : sync.status === "error"
        ? {
            color: "error" as const,
            icon: <ExclamationCircleOutlined />,
            label: "Retrying",
            detail:
              sync.error ??
              "Sync failed. Your data is safe on this device and will be retried.",
          }
        : sync.pending > 0
          ? {
              color: "warning" as const,
              icon: <CloudSyncOutlined />,
              label: `${sync.pending} pending`,
              detail: `${sync.pending} change${sync.pending === 1 ? "" : "s"} waiting to sync.`,
            }
          : {
              color: "success" as const,
              icon: <CheckCircleOutlined />,
              label: "Synced",
              detail: sync.lastSyncedAt
                ? `Everything is up to date. Last sync ${formatDateTime(sync.lastSyncedAt)}.`
                : "Everything is up to date.",
            };

  const content = (
    <div className="max-w-64 text-sm">
      <p className="m-0">{view.detail}</p>
      <Button
        size="small"
        className="mt-3"
        icon={<SyncOutlined />}
        onClick={() => void syncNow()}
        disabled={!online || sync.status === "syncing"}
        block
      >
        Sync now
      </Button>
    </div>
  );

  if (compact) {
    return (
      <Popover content={content} title="Sync status" trigger="click">
        <Button
          type="text"
          shape="circle"
          aria-label={`Sync status: ${view.label}`}
          icon={
            <Badge dot={sync.pending > 0 || sync.status === "error"} offset={[2, -2]}>
              {view.icon}
            </Badge>
          }
        />
      </Popover>
    );
  }

  return (
    <Popover content={content} title="Sync status" trigger="click">
      <Tag
        color={view.color}
        icon={view.icon}
        className="!m-0 cursor-pointer select-none !py-1"
      >
        {view.label}
      </Tag>
    </Popover>
  );
}

/** Full-width banner shown on top of the content while offline. */
export function OfflineBanner() {
  const { online } = useWorkspace();
  if (online) return null;

  return (
    <Tooltip title="Entries are stored on this device until you reconnect">
      <div
        className="no-print flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid #f0dfae",
          background: "#fdf7e6",
          color: "#8a6b13",
        }}
      >
        <DisconnectOutlined />
        <span>
          Offline mode — your entries are saved locally and will sync
          automatically.
        </span>
      </div>
    </Tooltip>
  );
}
