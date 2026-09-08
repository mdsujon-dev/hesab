"use client";

import { useRouter } from "next/navigation";
import { Button, Result } from "antd";
import { DisconnectOutlined } from "@ant-design/icons";

export function OfflineNotice() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Result
        icon={<DisconnectOutlined style={{ color: "#d97706" }} />}
        title="You are offline"
        subTitle="This page has not been opened before, so there is no saved copy. Your existing records are still available from the dashboard."
        extra={[
          <Button type="primary" key="retry" onClick={() => location.reload()}>
            Try again
          </Button>,
          <Button key="home" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>,
        ]}
      />
    </div>
  );
}
