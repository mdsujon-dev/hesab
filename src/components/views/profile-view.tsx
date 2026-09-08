"use client";

import { useState } from "react";
import {
  App,
  Avatar,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
} from "antd";
import { LockOutlined, SaveOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { CURRENCIES, currencySymbol, formatMoney } from "@/lib/money";
import { EXPENSE, GOLD, INCOME, ON_GOLD } from "@/components/providers/theme-provider";
import { formatDate, totalsOf } from "@/lib/utils";

type ProfileValues = { name: string; phone?: string; currency: string };
type PasswordValues = { currentPassword: string; newPassword: string };

export function ProfileView() {
  const { user, setUser, transactions } = useWorkspace();
  const { message } = App.useApp();
  const [profileForm] = Form.useForm<ProfileValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const totals = totalsOf(transactions);
  const firstEntry = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )[0];

  async function saveProfile(values: ProfileValues) {
    setSavingProfile(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (body?.fields) {
          profileForm.setFields(
            Object.entries(body.fields as Record<string, string[]>).map(
              ([name, errors]) => ({ name: name as keyof ProfileValues, errors }),
            ),
          );
        }
        message.error(body?.error ?? "Could not save your profile");
        return;
      }

      setUser(body.user);
      message.success("Profile updated");
    } catch {
      message.error("You appear to be offline. Try again once reconnected.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(values: PasswordValues) {
    setSavingPassword(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        message.error(body?.error ?? "Could not change your password");
        return;
      }

      passwordForm.resetFields();
      message.success("Password changed");
    } catch {
      message.error("You appear to be offline. Try again once reconnected.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Card variant="outlined">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            size={64}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #a8801f)`,
              color: ON_GOLD,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {user.name}
            </Typography.Title>
            <Typography.Text type="secondary">{user.email}</Typography.Text>
          </div>
        </div>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Card variant="outlined" size="small">
            <Statistic title="Transactions" value={transactions.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="outlined" size="small">
            <Statistic
              title="Total income"
              value={totals.income}
              formatter={(value) => formatMoney(Number(value), user.currency)}
              styles={{ content: { color: INCOME, fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="outlined" size="small">
            <Statistic
              title="Total expense"
              value={totals.expense}
              formatter={(value) => formatMoney(Number(value), user.currency)}
              styles={{ content: { color: EXPENSE, fontSize: 18 } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="outlined" size="small">
            <Statistic
              title="Tracking since"
              value={firstEntry ? formatDate(firstEntry.date) : "—"}
              styles={{ content: { fontSize: 16 } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card variant="outlined" title="Account details">
            <Form<ProfileValues>
              form={profileForm}
              layout="vertical"
              onFinish={saveProfile}
              disabled={savingProfile}
              initialValues={{
                name: user.name,
                phone: user.phone ?? "",
                currency: user.currency,
              }}
            >
              <Form.Item
                name="name"
                label="Full name"
                rules={[{ required: true, min: 2, message: "Enter your name" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  {
                    pattern: /^[0-9+\-\s()]{6,20}$/,
                    message: "Enter a valid phone number",
                  },
                ]}
              >
                <Input inputMode="tel" placeholder="Optional" />
              </Form.Item>

              <Form.Item
                name="currency"
                label="Currency"
                tooltip="Used across the dashboard, reports and exports"
              >
                <Select
                  options={CURRENCIES.map((code) => ({
                    value: code,
                    label: `${code} (${currencySymbol(code)})`,
                  }))}
                  showSearch
                />
              </Form.Item>

              <Button
                tone="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={savingProfile}
              >
                Save changes
              </Button>
            </Form>

            <Descriptions
              className="mt-5"
              size="small"
              column={1}
              items={[
                { key: "email", label: "Email", children: user.email },
                {
                  key: "id",
                  label: "Workspace id",
                  children: (
                    <Typography.Text copyable className="text-xs">
                      {user.id}
                    </Typography.Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card variant="outlined" title="Change password">
            <Form<PasswordValues>
              form={passwordForm}
              layout="vertical"
              onFinish={changePassword}
              disabled={savingPassword}
            >
              <Form.Item
                name="currentPassword"
                label="Current password"
                rules={[{ required: true, message: "Enter your current password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New password"
                rules={[
                  { required: true, message: "Choose a new password" },
                  { min: 8, message: "At least 8 characters" },
                  {
                    pattern: /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/,
                    message: "Include at least one letter and one number",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                label="Confirm new password"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Repeat the new password" },
                  ({ getFieldValue }) => ({
                    validator(_rule, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The passwords do not match"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Button
                tone="primary"
                htmlType="submit"
                loading={savingPassword}
              >
                Update password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
