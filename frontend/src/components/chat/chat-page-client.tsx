'use client';

import { useState } from 'react';

import ConversationsSidebar from '@/components/chat/conversations-sidebar';
import ChatWindow from '@/components/chat/chat-window';

export function ChatPageClient({
  initialConversationId,
}: {
  initialConversationId?: string | null;
}) {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialConversationId ?? null,
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-9xl gap-6 h-[90vh]">
        <ConversationsSidebar
          onSelect={(id) => setActiveConversation(id)}
          onDelete={(id) => {
            if (activeConversation === id) setActiveConversation(null);
          }}
        />
        <ChatWindow conversationId={activeConversation} />
      </div>
    </main>
  );
}
