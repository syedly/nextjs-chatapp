/**
 * components/chat/ToolCallBadge.tsx
 * Shows a badge while the agent is using a tool.
 */

import { Search, Youtube, Database, Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
}

const TOOL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  google_search: {
    label: "Searching the web…",
    icon: <Search className="w-3.5 h-3.5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  youtube_transcript: {
    label: "Fetching YouTube transcript…",
    icon: <Youtube className="w-3.5 h-3.5" />,
    color: "text-red-600 bg-red-50 border-red-200",
  },
  query_database: {
    label: "Querying database…",
    icon: <Database className="w-3.5 h-3.5" />,
    color: "text-green-600 bg-green-50 border-green-200",
  },
};

export default function ToolCallBadge({ toolName }: ToolCallBadgeProps) {
  const config = TOOL_CONFIG[toolName] ?? {
    label: `Using ${toolName}…`,
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: "text-slate-600 bg-slate-50 border-slate-200",
  };

  return (
    <div className="flex gap-3 py-2 ml-11">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
        <Loader2 className="w-3 h-3 animate-spin opacity-60" />
      </div>
    </div>
  );
}
