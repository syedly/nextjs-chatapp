/**
 * app/dashboard/chat/new/page.tsx
 * New chat page — starts a fresh conversation, optionally with a pre-filled prompt.
 */

import ChatWindow from "@/components/chat/ChatWindow";

export default function NewChatPage() {
  return <ChatWindow chatId="new" />;
}
