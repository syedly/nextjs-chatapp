/**
 * app/dashboard/page.tsx
 * New chat landing page — shown when no chat is selected.
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Search,
  Youtube,
  Database,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const STARTER_PROMPTS = [
  {
    icon: <Search className="w-5 h-5 text-blue-500" />,
    label: "Web Search",
    prompt: "Who is the current CEO of OpenAI?",
    color: "bg-blue-50 border-blue-100 hover:border-blue-200",
  },
  {
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    label: "YouTube Transcript",
    prompt: "Summarize this video: https://youtube.com/watch?v=dQw4w9WgXcQ",
    color: "bg-red-50 border-red-100 hover:border-red-200",
  },
  {
    icon: <Database className="w-5 h-5 text-green-500" />,
    label: "Database Query",
    prompt: "Show me all active customers",
    color: "bg-green-50 border-green-100 hover:border-green-200",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    label: "General AI",
    prompt: "Explain the difference between LangChain and LangGraph",
    color: "bg-purple-50 border-purple-100 hover:border-purple-200",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const startChat = async (prompt: string) => {
    // Navigate to a new chat page with the prompt as a query param
    router.push(`/dashboard/chat/new?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          What can I help you with?
        </h1>
        <p className="text-muted-foreground max-w-md">
          I can search the web, transcribe YouTube videos, query your database,
          and answer any question.
        </p>
      </div>

      {/* Starter prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {STARTER_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => startChat(item.prompt)}
            className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${item.color}`}
          >
            <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {item.label}
              </p>
              <p className="text-sm text-foreground line-clamp-2">{item.prompt}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
