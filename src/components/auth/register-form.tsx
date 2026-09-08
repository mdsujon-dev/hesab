"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Alert, Col, Divider, Form, Input, Row } from "antd";
import { Button } from "@/components/ui/button";
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AuthHeading } from "@/components/auth/auth-shell";

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export function RegisterForm() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Surface server-side validation next to the offending field.
        if (body?.fields) {
          form.setFields(
            Object.entries(body.fields as Record<string, string[]>).map(
              ([name, errors]) => ({ name: name as keyof FormValues, errors }),
            ),
          );
        }
        setError(body?.error ?? "Could not create the account.");
        return;
      }

      message.success("Account created. Welcome to Hesab!");
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

  return (
    <>
      <AuthHeading
        title="Create your workspace"
        subtitle="Free, private, and ready in a few seconds"
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
        form={form}
        layout="vertical"
        size="large"
        onFinish={onFinish}
        disabled={submitting}
      >
        {/* Two fields per row from `sm` up; stacked on phones. */}
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Full name"
              rules={[{ required: true, min: 2, message: "Enter your name" }]}
            >
              <Input
                prefix={<UserOutlined className="opacity-45" />}
                placeholder="Your name"
                autoFocus
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Enter your email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="opacity-45" />}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="Phone"
              tooltip="Optional — you can sign in with it later"
              rules={[
                {
                  pattern: /^[0-9+\-\s()]{6,20}$/,
                  message: "Enter a valid phone number",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="opacity-45" />}
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
                inputMode="tel"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label="Password"
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
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
        </Row>

        <p className="mb-5 mt-1 text-xs opacity-50">
          Password needs at least 8 characters, with a letter and a number.
        </p>

        <Button
          tone="primary"
          htmlType="submit"
          block
          size="large"
          loading={submitting}
        >
          Create account
        </Button>
      </Form>

      <Divider style={{ marginBlock: 22, borderColor: "#eceef2" }}>
        <span className="text-xs opacity-45">Already registered?</span>
      </Divider>

      <Link href="/login" className="block">
        <Button block size="large">
          Sign in instead
        </Button>
      </Link>
    </>
  );
}
