import { Suspense } from "react";
import type { Metadata } from "next";
import { MiniLoader } from "@/components/ui/loader";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<MiniLoader />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
