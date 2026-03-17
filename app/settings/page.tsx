/**
 * app/settings/page.tsx
 * Settings page — shows user profile (custom auth).
 */

import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { ArrowLeft, Settings2 } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const { userId } = await getAuth();
  if (!userId) redirect("/sign-in");

  await connectToDatabase();
  const user = await User.findById(userId).select("email name createdAt").lean();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r border-border bg-background flex flex-col p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <Settings2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Settings</h2>
        </div>

        <nav className="space-y-1">
          <div className="px-3 py-2 rounded-lg bg-accent text-sm font-medium">
            Profile
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account and preferences.
          </p>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.name && (
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
