"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Form, Input, Result } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { AuthHeading } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

type FormValues = { email: string };

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error ?? "Could not send the reset email.");
        return;
      }

      setSentTo(values.email);
    } catch {
      setError(
        "No connection to the server. Check your internet and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle={
          <>
            If <strong>{sentTo}</strong> has an account, a reset link is on its
            way. It expires in 60 minutes — remember to check your spam folder.
          </>
        }
        extra={[
          <Link key="login" href="/login">
            <Button tone="primary" size="large">
              Back to sign in
            </Button>
          </Link>,
          <Button key="again" size="large" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>,
        ]}
      />
    );
  }

  return (
    <>
      <AuthHeading
        title="Forgot your password?"
        subtitle="We will email you a link to set a new one"
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
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Enter your email" },
            { type: "email", message: "Enter a valid email" },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input
            prefix={<MailOutlined className="opacity-45" />}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            autoFocus
          />
        </Form.Item>

        <Button
          tone="primary"
          htmlType="submit"
          block
          size="large"
          loading={submitting}
        >
          Send reset link
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login">
          <ArrowLeftOutlined /> Back to sign in
        </Link>
      </p>
    </>
  );
}
