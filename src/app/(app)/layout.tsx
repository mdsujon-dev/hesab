import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <WorkspaceProvider initialUser={user}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
