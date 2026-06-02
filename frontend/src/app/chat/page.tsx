import { ChatPageClient } from '@/components/chat/chat-page-client';

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ conversationId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <ChatPageClient initialConversationId={resolvedSearchParams?.conversationId ?? null} />
  );
}
