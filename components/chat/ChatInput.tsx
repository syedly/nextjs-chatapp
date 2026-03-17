/**
 * components/chat/ChatInput.tsx
 * Message input bar — auto-resizing textarea with send button.
 */

"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border bg-background shadow-sm transition-shadow",
        "focus-within:shadow-md focus-within:border-primary/40",
        disabled && "opacity-80"
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Message AI Agent… (Shift+Enter for new line)"
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60",
          "min-h-[48px] max-h-[200px] overflow-y-auto scrollbar-thin"
        )}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={cn(
          "m-1.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150",
          value.trim() && !disabled
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        title="Send message (Enter)"
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
