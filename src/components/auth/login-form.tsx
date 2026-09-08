"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Alert, Divider, Form, Input } from "antd";
import { Button } from "@/components/ui/button";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { AuthHeading } from "@/components/auth/auth-shell";

type FormValues = { identifier: string; password: string };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error ?? "Could not sign in. Please try again.");
        return;
      }

      message.success(`Welcome back, ${body.user.name.split(" ")[0]}`);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError(
        "No connection to the server. Check your internet and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to your financial workspace"
      />

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          className="mb-4"
          closable={{ onClose: () => setError(null) }}
        />
      ) : null}

      <Form<FormValues>
        layout="vertical"
        size="large"
        onFinish={onFinish}
        disabled={submitting}
      >
        <Form.Item
          name="identifier"
          label="Email or phone"
          rules={[{ required: true, message: "Enter your email or phone" }]}
        >
          <Input
            prefix={<UserOutlined className="opacity-45" />}
            placeholder="you@example.com"
            autoComplete="username"
            inputMode="email"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <span className="flex w-full items-center justify-between">
              <span>Password</span>
            </span>
          }
          rules={[{ required: true, message: "Enter your password" }]}
          style={{ marginBottom: 10 }}
        >
          <Input.Password
            prefix={<LockOutlined className="opacity-45" />}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="mb-5 text-right">
          <Link href="/forgot-password" className="text-sm">
            Forgot password?
          </Link>
        </div>

        <Button
          tone="primary"
          htmlType="submit"
          block
          size="large"
          loading={submitting}
        >
          Sign in
        </Button>
      </Form>

      <Divider style={{ marginBlock: 22, borderColor: "#eceef2" }}>
        <span className="text-xs opacity-45">New to Hesab?</span>
      </Divider>

      <Link href="/register" className="block">
        <Button block size="large">
          Create an account
        </Button>
      </Link>

      <p className="mt-6 text-center text-xs leading-relaxed opacity-45">
        Your records stay on this device when you are offline and sync
        automatically once you reconnect.
      </p>
    </>
  );
}
