"use client";

import { useState } from "react";
import {
  App,
  Alert,
  Button,
  Descriptions,
  Input,
  Modal,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { Card } from "@/components/ui/card";
import {
  CloudDownloadOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { clearWorkspace } from "@/offline/db";
import { pullAll } from "@/offline/sync";
import { formatDateTime } from "@/lib/utils";

export function SettingsView() {
  const router = useRouter();
  const { user, sync, online, syncNow, transactions, categories } =
    useWorkspace();
  const { message, modal } = App.useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function refreshLocalCopy() {
    if (!online) {
      message.warning("You need to be online to re-download your data.");
      return;
    }
    setRefreshing(true);
    try {
      await pullAll();
      message.success("Local copy refreshed from the server");
    } catch {
      message.error("Could not refresh. Try again in a moment.");
    } finally {
      setRefreshing(false);
    }
  }

  function confirmClearLocal() {
    modal.confirm({
      title: "Clear offline data on this device?",
      content:
        sync.pending > 0
          ? `${sync.pending} change${sync.pending === 1 ? "" : "s"} have not synced yet and will be lost. Sync first if you want to keep them.`
          : "Your data stays on the server and will be downloaded again.",
      okText: "Clear and re-download",
      okButtonProps: { danger: true },
      onOk: async () => {
        await clearWorkspace();
        window.location.reload();
      },
    });
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        message.error(body?.error ?? "Could not delete the account");
        return;
      }

      await clearWorkspace();
      message.success("Your account has been deleted");
      router.replace("/register");
    } catch {
      message.error("You appear to be offline. Try again once reconnected.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPassword("");
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Card
        title="Sync and offline data"
        extra={
          <Tag color={online ? "success" : "warning"}>
            {online ? "Online" : "Offline"}
          </Tag>
        }
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Statistic title="Transactions" value={transactions.length} />
            <Statistic title="Categories" value={categories.length} />
            <Statistic
              title="Waiting to sync"
              value={sync.pending}
              styles={{ content: { color: sync.pending > 0 ? "#c07d10" : undefined } }}
            />
            <Statistic
              title="Last sync"
              value={
                sync.lastSyncedAt ? formatDateTime(sync.lastSyncedAt) : "Never"
              }
              styles={{ content: { fontSize: 14 } }}
            />
          </div>

          {sync.status === "error" && sync.error ? (
            <Alert
              type="warning"
              showIcon
              title="Sync is retrying"
              description={`${sync.error} Your data is safe on this device.`}
            />
          ) : null}

          <Space wrap>
            <Button
              icon={<SyncOutlined />}
              onClick={() => void syncNow()}
              disabled={!online || sync.status === "syncing"}
              loading={sync.status === "syncing"}
            >
              Sync now
            </Button>
            <Button
              icon={<CloudDownloadOutlined />}
              onClick={refreshLocalCopy}
              loading={refreshing}
              disabled={!online}
            >
              Re-download from server
            </Button>
            <Button
              icon={<DatabaseOutlined />}
              onClick={confirmClearLocal}
              danger
            >
              Clear offline data
            </Button>
          </Space>

          <Typography.Text type="secondary" className="text-xs">
            Entries you add offline are stored in this browser (IndexedDB) and
            uploaded automatically when the connection returns. Signing out
            clears them from this device.
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Install the app">
        <Typography.Paragraph type="secondary" className="!mb-2">
          Hesab works as an installable app. On Android or desktop Chrome, open
          the browser menu and choose <strong>Install app</strong>. On iPhone,
          tap <strong>Share</strong> then{" "}
          <strong>Add to Home Screen</strong>. Once installed it opens full
          screen and keeps working without a connection.
        </Typography.Paragraph>
      </Card>

      <Card title="About">
        <Descriptions
          size="small"
          column={1}
          items={[
            { key: "account", label: "Signed in as", children: user.email },
            { key: "currency", label: "Currency", children: user.currency },
            {
              key: "storage",
              label: "Local storage",
              children: "IndexedDB (Dexie)",
            },
          ]}
        />
      </Card>

      <Card title="Danger zone">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type="error"
            showIcon
            title="Delete account"
            description="This permanently removes your account, every transaction and every category. It cannot be undone."
          />
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            onClick={() => setConfirmOpen(true)}
          >
            Delete my account
          </Button>
        </Space>
      </Card>

      <Modal
        open={confirmOpen}
        title="Delete your account?"
        okText="Permanently delete"
        okButtonProps={{ danger: true, disabled: password.length === 0 }}
        confirmLoading={deleting}
        onOk={deleteAccount}
        onCancel={() => {
          setConfirmOpen(false);
          setPassword("");
        }}
      >
        <Typography.Paragraph>
          Enter your password to confirm. Everything in this workspace will be
          erased.
        </Typography.Paragraph>
        <Input.Password
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          onPressEnter={() => password && deleteAccount()}
        />
      </Modal>
    </Space>
  );
}
