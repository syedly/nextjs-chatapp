/**
 * app/api/chats/[chatId]/messages/route.ts
 * Get all messages for a specific chat.
 */

import { getAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";

export async function GET(
  _req: Request,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await getAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();

  const chat = await Chat.findById(params.chatId);
  if (!chat || chat.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  const messages = await Message.find({ chatId: params.chatId })
    .sort({ createdAt: 1 })
    .lean();

  return Response.json(messages);
}
