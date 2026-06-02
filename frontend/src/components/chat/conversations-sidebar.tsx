'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiDelete } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Trash } from 'lucide-react';

type ConversationSummary = {
  _id: string;
  productName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
  unreadCount?: number;
};

export default function ConversationsSidebar({
  onSelect,
  onDelete,
}: {
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null);
  const { toast } = useToast();

  function formatTimestamp(value: string | Date | undefined) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return 'Yesterday';
    // If same year, show month/day, otherwise show short date
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString();
  }

  useEffect(() => {
    let mounted = true;
    apiGet<ConversationSummary[]>('/api/conversations')
      .then((data) => {
        if (mounted) setConversations(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="w-80 border-r border-slate-200 p-4">
      <h2 className="mb-4 text-lg font-semibold">Conversations</h2>
      <ul className="space-y-2">
        {conversations.map((c) => {
          const ts = c.lastMessageAt ?? c.updatedAt ?? undefined;
          const formatted = formatTimestamp(ts);
          const unread = c.unreadCount && c.unreadCount > 0;

          return (
            <li key={c._id}>
              <div className="flex items-start justify-between rounded-lg hover:bg-slate-100">
                <button
                  className="w-full text-left rounded-l-lg px-3 py-2 flex justify-between items-start"
                  onClick={() => onSelect(c._id)}
                >
                  <div className="flex-1">
                    <div className={`text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>
                      {c.productName ?? 'Unnamed product'}
                    </div>
                    <div className={`text-sm ${unread ? 'font-medium' : ''} text-slate-700`}>
                      {c.lastMessage ?? 'New conversation'}
                    </div>
                  </div>
                </button>
                <div className="flex items-center pr-2">
                  <button
                    className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationToDelete(c);
                    }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {conversationToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-lg font-semibold text-slate-900">Delete conversation?</div>
            <div className="mt-2 text-sm text-slate-600">
              This will permanently remove the chat for{' '}
              <span className="font-medium text-slate-900">
                {conversationToDelete.productName ?? 'Unnamed product'}
              </span>
              .
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setConversationToDelete(null)}
              >
                No
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={async () => {
                  const target = conversationToDelete;
                  setConversationToDelete(null);
                  try {
                    await apiDelete(`/api/conversations/${target._id}`);
                    setConversations((prev) => prev.filter((x) => x._id !== target._id));
                    if (onDelete) onDelete(target._id);
                    toast({
                      type: 'success',
                      title: 'Conversation deleted',
                      description: 'The chat was removed successfully.',
                    });
                  } catch (err) {
                    console.error('Delete failed', err);
                    toast({
                      type: 'error',
                      title: 'Delete failed',
                      description: err instanceof Error ? err.message : String(err),
                    });
                  }
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
