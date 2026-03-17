/**
 * components/chat/Sidebar.tsx
 * Left sidebar — new chat button, chat history, user menu.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Chat {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export default function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => data.user && setUser(data.user))
      .catch(() => {});
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    // Refresh chat list when route changes (new chat created)
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [fetchChats, pathname]);

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletingId(chatId);
    try {
      const res = await fetch(`/api/chats?chatId=${chatId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (pathname.includes(chatId)) {
          router.push("/dashboard");
        }
        toast.success("Chat deleted");
      }
    } catch {
      toast.error("Failed to delete chat");
    } finally {
      setDeletingId(null);
    }
  };

  // Group chats by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const grouped = chats.reduce(
    (acc, chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= today) acc.today.push(chat);
      else if (chatDate >= yesterday) acc.yesterday.push(chat);
      else if (chatDate >= lastWeek) acc.lastWeek.push(chat);
      else acc.older.push(chat);
      return acc;
    },
    { today: [], yesterday: [], lastWeek: [], older: [] } as Record<string, Chat[]>
  );

  const activeChatId = pathname.split("/chat/")[1];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            AI Agent
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href="/dashboard/chat/new"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-150 group"
        >
          <Plus className="w-4 h-4" />
          New Chat
          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-1.5 px-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 rounded-md bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">No chats yet</p>
          </div>
        ) : (
          <>
            <ChatGroup
              label="Today"
              chats={grouped.today}
              activeChatId={activeChatId}
              deletingId={deletingId}
              onDelete={deleteChat}
            />
            <ChatGroup
              label="Yesterday"
              chats={grouped.yesterday}
              activeChatId={activeChatId}
              deletingId={deletingId}
              onDelete={deleteChat}
            />
            <ChatGroup
              label="Last 7 days"
              chats={grouped.lastWeek}
              activeChatId={activeChatId}
              deletingId={deletingId}
              onDelete={deleteChat}
            />
            <ChatGroup
              label="Older"
              chats={grouped.older}
              activeChatId={activeChatId}
              deletingId={deletingId}
              onDelete={deleteChat}
            />
          </>
        )}
      </div>

      {/* User + Settings */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.name || user?.email || "User"}
            </p>
            <p className="text-white/40 text-xs truncate">
              {user?.email}
            </p>
          </div>
          <Link
            href="/settings"
            className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            type="button"
            className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/auth/signout", { method: "POST" });
              window.location.href = "/sign-in";
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Chat Group ───────────────────────────────────────────────

function ChatGroup({
  label,
  chats,
  activeChatId,
  deletingId,
  onDelete,
}: {
  label: string;
  chats: Chat[];
  activeChatId?: string;
  deletingId: string | null;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  if (!chats.length) return null;

  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        {label}
      </p>
      <div className="space-y-0.5">
        {chats.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            isActive={activeChatId === chat._id}
            isDeleting={deletingId === chat._id}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function ChatItem({
  chat,
  isActive,
  isDeleting,
  onDelete,
}: {
  chat: Chat;
  isActive: boolean;
  isDeleting: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <Link
      href={`/dashboard/chat/${chat._id}`}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-100",
        isActive
          ? "bg-blue-500/20 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/90"
      )}
    >
      <MessageSquare
        className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-blue-400" : "text-white/30")}
      />
      <span className="flex-1 truncate text-xs leading-relaxed">{chat.title}</span>
      <button
        onClick={(e) => onDelete(e, chat._id)}
        disabled={isDeleting}
        className={cn(
          "flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-all",
          "hover:bg-white/10 text-white/40 hover:text-red-400",
          isDeleting && "opacity-50 cursor-not-allowed"
        )}
        title="Delete chat"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </Link>
  );
}
