import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { MiniLoader } from "@/components/ui/loader";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<MiniLoader />}>
      <LoginForm />
    </Suspense>
  );
}
