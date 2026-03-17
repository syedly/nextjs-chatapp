/**
 * components/chat/ChatWindow.tsx
 * Main chat interface — message list + input bar.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ToolCallBadge from "./ToolCallBadge";
import { Sparkles } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface StreamEvent {
  type: "chat_id" | "token" | "tool_use" | "done" | "error";
  content?: string;
  chatId?: string;
  tool?: string;
  input?: string;
  message?: string;
}

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    chatId === "new" ? null : chatId
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Load existing messages ─────────────────────────────────
  useEffect(() => {
    if (chatId === "new") {
      setMessages([]);
      const q = searchParams.get("q");
      if (q) {
        // Auto-send starter prompt
        sendMessage(q);
      }
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.map((m: any) => ({
              id: m._id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            }))
          );
        }
      } catch {
        // ignore
      }
    };

    loadMessages();
    setCurrentChatId(chatId);
  }, [chatId]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");
      setActiveTool(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            chatId: currentChatId,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Network error");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let newChatId = currentChatId;
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event: StreamEvent = JSON.parse(raw);

              if (event.type === "chat_id" && event.chatId) {
                newChatId = event.chatId;
                setCurrentChatId(event.chatId);
                // Update URL without full navigation
                window.history.replaceState(
                  null,
                  "",
                  `/dashboard/chat/${event.chatId}`
                );
              }

              if (event.type === "token" && event.content) {
                accumulated += event.content;
                setStreamingContent(accumulated);
                setActiveTool(null);
              }

              if (event.type === "tool_use" && event.tool) {
                setActiveTool(event.tool);
              }

              if (event.type === "done") {
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: "assistant",
                  content: accumulated,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
                setActiveTool(null);
                setIsStreaming(false);
              }

              if (event.type === "error") {
                throw new Error(event.message || "Stream error");
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        console.error("Send message error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              "I encountered an error processing your message. Please try again.",
          },
        ]);
        setIsStreaming(false);
        setStreamingContent("");
        setActiveTool(null);
      }
    },
    [isStreaming, currentChatId]
  );

  const regenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages((prev) => {
        const reversed = [...prev].reverse();
        const assistantIdx = reversed.findIndex((m) => m.role === "assistant");
        if (assistantIdx !== -1) {
          const arr = [...prev];
          arr.splice(prev.length - 1 - assistantIdx, 1);
          return arr;
        }
        return prev;
      });
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  // ── Empty state ────────────────────────────────────────────
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">New conversation</h2>
              <p className="text-muted-foreground text-sm">
                Ask me anything — I can search the web, read YouTube videos, and query your database.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={
                  index === messages.length - 1 && msg.role === "assistant"
                }
                onRegenerate={regenerate}
              />
            ))}

            {/* Streaming response */}
            {isStreaming && (
              <div>
                {activeTool && <ToolCallBadge toolName={activeTool} />}
                {streamingContent ? (
                  <MessageBubble
                    message={{
                      id: "streaming",
                      role: "assistant",
                      content: streamingContent,
                    }}
                    isStreaming
                  />
                ) : !activeTool ? (
                  <TypingIndicator />
                ) : null}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
          <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
