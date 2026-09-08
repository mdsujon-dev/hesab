"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Alert, Form, Input, Result } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { AuthHeading } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

type FormValues = { password: string; confirm: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.get("token") ?? "";

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error ?? "Could not reset your password.");
        return;
      }

      // The API signs the user in on success, so go straight to the app.
      message.success("Password updated. You are signed in.");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(
        "No connection to the server. Check your internet and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Result
        status="warning"
        title="This link is incomplete"
        subTitle="The reset link is missing its token. Request a fresh one and use the newest email."
        extra={
          <Link href="/forgot-password">
            <Button tone="primary" size="large">
              Request a new link
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <AuthHeading
        title="Set a new password"
        subtitle="Choose something you have not used before"
      />

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          className="mb-4"
          closable={{ onClose: () => setError(null) }}
          action={
            <Link href="/forgot-password">
              <Button size="small">New link</Button>
            </Link>
          }
        />
      ) : null}

      <Form<FormValues>
        layout="vertical"
        size="large"
        onFinish={onFinish}
        disabled={submitting}
      >
        <Form.Item
          name="password"
          label="New password"
          rules={[
            { required: true, message: "Choose a password" },
            { min: 8, message: "At least 8 characters" },
            {
              pattern: /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/,
              message: "Include at least one letter and one number",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="opacity-45" />}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Repeat the password" },
            ({ getFieldValue }) => ({
              validator(_rule, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("The passwords do not match"));
              },
            }),
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            prefix={<LockOutlined className="opacity-45" />}
            placeholder="Repeat it"
            autoComplete="new-password"
          />
        </Form.Item>

        <Button
          tone="primary"
          htmlType="submit"
          block
          size="large"
          loading={submitting}
        >
          Update password
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login">Back to sign in</Link>
      </p>
    </>
  );
}
