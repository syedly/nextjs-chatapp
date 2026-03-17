/**
 * app/dashboard/layout.tsx
 * Dashboard layout — renders the sidebar alongside the main content.
 */

import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await getAuth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
