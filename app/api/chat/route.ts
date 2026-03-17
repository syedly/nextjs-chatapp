/**
 * app/api/chat/route.ts
 * Main chat API — receives messages, runs the agent, streams back the response.
 */

import { getAuth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";
import { runAgentStream, type ChatMessage } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────
    const { userId } = await getAuth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { message, chatId } = body as {
      message: string;
      chatId?: string;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Connect to DB ─────────────────────────────────────────
    await connectToDatabase();

    // ── Get or create chat ────────────────────────────────────
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return new Response(JSON.stringify({ error: "Chat not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new chat with a title derived from the first message
      const title =
        message.length > 50 ? message.slice(0, 50) + "..." : message;
      chat = await Chat.create({ userId, title });
    }

    // ── Save user message ─────────────────────────────────────
    await Message.create({
      chatId: chat._id,
      role: "user",
      content: message,
    });

    // ── Fetch chat history ────────────────────────────────────
    const previousMessages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .lean();

    const chatHistory: ChatMessage[] = previousMessages
      .slice(-20) // Keep last 20 messages for context window
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // ── Stream response ───────────────────────────────────────
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the chat ID so the client can use it for subsequent messages
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "chat_id", chatId: chat._id.toString() })}\n\n`
            )
          );

          await runAgentStream(
            message,
            chatHistory,
            // onToken — stream each chunk to the client
            (token) => {
              fullResponse += token;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "token", content: token })}\n\n`
                )
              );
            },
            // onToolUse — notify client which tool is being called
            (tool, input) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_use",
                    tool,
                    input: input.slice(0, 100), // truncate for UI
                  })}\n\n`
                )
              );
            }
          );

          // ── Save assistant message ─────────────────────────
          if (fullResponse) {
            await Message.create({
              chatId: chat._id,
              role: "assistant",
              content: fullResponse,
            });
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Agent error:", error);
          const errorMsg =
            error instanceof Error ? error.message : "Agent encountered an error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: errorMsg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
