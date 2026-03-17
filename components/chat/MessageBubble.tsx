/**
 * components/chat/MessageBubble.tsx
 * Renders a single chat message — user (right) or assistant (left).
 * Supports Markdown, code highlighting, copy and regenerate buttons.
 */

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, RefreshCw, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./ChatWindow";

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export default function MessageBubble({
  message,
  isLast,
  isStreaming,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 py-3 message-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        {isUser ? (
          // User message — simple styled bubble
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          // Assistant message — markdown rendered
          <div className="prose-chat w-full">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom code block with copy button
                code({ node, className, children, ...props }) {
                  const isInline = !className;
                  const language = className?.replace("language-", "") ?? "";

                  if (isInline) {
                    return (
                      <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="relative group/code my-3">
                      {language && (
                        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
                          <span className="text-xs text-zinc-400 font-mono">
                            {language}
                          </span>
                          <CopyCodeButton code={String(children)} />
                        </div>
                      )}
                      <pre
                        className={cn(
                          "bg-zinc-900 text-zinc-100 p-4 overflow-x-auto text-[13px] font-mono",
                          language ? "rounded-b-lg" : "rounded-lg"
                        )}
                      >
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 rounded-full" />
            )}
          </div>
        )}

        {/* Action buttons — visible on hover for the last assistant message */}
        {!isUser && !isStreaming && isLast && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton
              onClick={copyToClipboard}
              title={copied ? "Copied!" : "Copy message"}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </ActionButton>
            {onRegenerate && (
              <ActionButton onClick={onRegenerate} title="Regenerate response">
                <RefreshCw className="w-3.5 h-3.5" />
              </ActionButton>
            )}
          </div>
        )}

        {/* Copy for non-last assistant messages */}
        {!isUser && !isStreaming && !isLast && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton onClick={copyToClipboard} title={copied ? "Copied!" : "Copy"}>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </button>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" /> Copy
        </>
      )}
    </button>
  );
}
