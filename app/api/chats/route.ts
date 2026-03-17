/**
 * app/api/chats/route.ts
 * CRUD for chats — list and delete chats.
 */

import { getAuth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";

// GET /api/chats — list all chats for the current user
export async function GET() {
  const { userId } = await getAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();

  const chats = await Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return Response.json(chats);
}

// DELETE /api/chats?chatId=xxx — delete a chat and its messages
export async function DELETE(req: NextRequest) {
  const { userId } = await getAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const chatId = req.nextUrl.searchParams.get("chatId");
  if (!chatId) return new Response("chatId required", { status: 400 });

  await connectToDatabase();

  const chat = await Chat.findById(chatId);
  if (!chat || chat.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  await Promise.all([
    Chat.findByIdAndDelete(chatId),
    Message.deleteMany({ chatId }),
  ]);

  return Response.json({ success: true });
}
