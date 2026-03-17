/**
 * app/dashboard/chat/[chatId]/page.tsx
 * Individual chat view — loads existing messages and the chat interface.
 */

import ChatWindow from "@/components/chat/ChatWindow";

interface ChatPageProps {
  params: { chatId: string };
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatWindow chatId={params.chatId} />;
}
