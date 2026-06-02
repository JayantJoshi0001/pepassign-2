'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { useSocket } from './useSocket';
import { Loader, Paperclip, SendIcon, X } from 'lucide-react';

type UserSummary = {
  _id?: string;
  id?: string;
  username?: string;
  businessProfile?: { businessName?: string };
};

type Attachment = {
  url: string;
  name: string;
  mimeType?: string;
};

type ChatMessage = {
  body?: string;
  senderRole?: 'buyer' | 'seller';
  senderId?: string;
  timestamp?: string;
  createdAt?: string;
  attachments?: Attachment[];
  status?: string;
};

type ConversationData = {
  sellerId?: UserSummary;
  buyerId?: UserSummary;
  productId?: { productName?: string };
  lastMessage?: string;
};

type SocketMessagePayload = {
  conversationId: string;
  message: ChatMessage;
};

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return undefined;

  const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function formatMessageTime(value: string | Date | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({ conversationId }: { conversationId: string | null }) {
  const socketRef = useSocket();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUsername = getCookieValue('pepassign_username');

  useEffect(() => {
    if (!conversationId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      apiGet<ConversationData>(`/api/conversations/${conversationId}`),
      apiGet<ChatMessage[]>(`/api/conversations/${conversationId}/messages?limit=50`),
    ])
      .then(([conversationData, messagesData]) => {
        setConversation(conversationData);
        setMessages(messagesData ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  async function loadOlder() {
    if (!conversationId || messages.length === 0) return;
    const first = messages[0];
    const beforeSource = first.timestamp || first.createdAt || new Date().toISOString();
    const before = encodeURIComponent(beforeSource);
    setLoading(true);
    try {
      const older = await apiGet<ChatMessage[]>(`/api/conversations/${conversationId}/messages?before=${before}&limit=50`);
      if (older && older.length) {
        setMessages((m) => [...older, ...m]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    socket.emit('join:conversation', { conversationId });

    const handler = (payload: SocketMessagePayload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((m) => [...m, payload.message]);
    };

    socket.on('message:created', handler);

    return () => {
      socket.emit('leave:conversation', { conversationId });
      socket.off('message:created', handler);
    };
  }, [socketRef, conversationId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!conversationId || (!text.trim() && attachments.length === 0)) return;
    const socket = socketRef.current;
    const senderRole = getOutboundSenderRole();
    const senderId = getOutboundSenderId();
    const optimistic: ChatMessage = {
      body: text.trim(),
      senderRole,
      senderId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attachments,
    };
    setMessages((m) => [...m, optimistic]);

    if (socket && socket.connected) {
      socket.emit('message:create', {
        conversationId,
        message: { senderRole, senderId, body: text.trim() || undefined, attachments },
      });
    } else {
      // fallback to REST
      await apiPost(`/api/conversations/${conversationId}/messages`, {
        senderRole,
        senderId,
        body: text.trim() || undefined,
        attachments,
      });
    }

    setText('');
    setAttachments([]);
  }

  async function uploadFile(file: File) {
    if (!conversationId) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      const res = await fetch(`/api/conversations/${conversationId}/attachments`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    const meta = await uploadFile(file);
    if (meta) setAttachments((a) => [...a, meta]);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttachment(idx: number) {
    setAttachments((a) => a.filter((_, i) => i !== idx));
  }

  const imageAttachments = attachments.filter((att) => att.mimeType?.startsWith('image/'));

  if (!conversationId) {
    return <div className="flex-1 p-6">Select a conversation</div>;
  }

  const seller = conversation?.sellerId;
  const buyer = conversation?.buyerId;
  const product = conversation?.productId;
  const sellerName =
    seller?.businessProfile?.businessName ?? seller?.username ?? 'Seller';
  const buyerName = buyer?.businessProfile?.businessName ?? buyer?.username ?? 'Buyer';
  const productName = product?.productName ?? 'Product';

  function getMessageSenderRole(message: ChatMessage) {
    const senderId = String(message?.senderId ?? '');
    const buyerId = String(buyer?._id ?? buyer?.id ?? '');
    const sellerId = String(seller?._id ?? seller?.id ?? '');

    if (senderId && senderId === buyerId) return 'buyer';
    if (senderId && senderId === sellerId) return 'seller';

    return message?.senderRole ?? 'buyer';
  }

  function getMessageSenderName(message: ChatMessage) {
    return getMessageSenderRole(message) === 'seller' ? sellerName : buyerName;
  }

  function isOwnMessage(message: ChatMessage) {
    if (!currentUsername) {
      return getMessageSenderRole(message) === 'buyer';
    }

    const senderName = getMessageSenderName(message);
    return senderName.toLowerCase() === currentUsername.toLowerCase();
  }

  function isGroupStart(message: ChatMessage, idx: number) {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    return getMessageSenderRole(prev) !== getMessageSenderRole(message) || String(prev?.senderId ?? '') !== String(message?.senderId ?? '');
  }

  function getOutboundSenderRole(): 'buyer' | 'seller' {
    if (!currentUsername) return 'buyer';
    return currentUsername.toLowerCase() === sellerName.toLowerCase() ? 'seller' : 'buyer';
  }

  function getOutboundSenderId() {
    return getOutboundSenderRole() === 'seller' ? seller?._id : buyer?._id;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-slate-900">{sellerName}</div>
            <div className="text-sm text-slate-500">RFQ for {productName}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            {buyer?.username ? <div>Buyer: {buyer.username}</div> : null}
            {conversation?.lastMessage ? <div className="mt-1">Last update: active</div> : <div className="mt-1">Start chatting</div>}
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-auto p-6">
        {loading ? (
          'Loading...'
        ) : (
          <div>
            {messages.length > 0 ? (
              <div className="mb-4 flex justify-center">
                <button onClick={loadOlder} className="rounded-md border px-3 py-1 text-sm">Load older</button>
              </div>
            ) : (
              <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                This chat is empty. Send a message to start the conversation.
              </div>
            )}

            {messages.map((m, idx) => {
              const own = isOwnMessage(m);
              const groupStart = isGroupStart(m, idx);
              const senderName = getMessageSenderName(m);

              return (
                <div key={idx} className={`mb-3 flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%]">
                    {groupStart ? (
                      <div className={`mb-1 px-1 text-xs font-semibold ${own ? 'text-right text-cyan-700' : 'text-slate-600'}`}>
                        {senderName}
                      </div>
                    ) : null}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        own ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {m.attachments.map((att: Attachment, attachmentIndex: number) => (
                            <div
                              key={attachmentIndex}
                              className={`rounded-xl px-3 py-2 text-xs ${
                                own
                                  ? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-50'
                                  : 'border border-cyan-100 bg-white text-slate-600'
                              }`}
                            >
                              {att.mimeType?.startsWith('image/') ? (
                                <div className="flex items-center gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={att.url} alt={att.name} className="h-100 w-100 rounded-lg object-cover" />
                                  {/* <span>{att.name}</span> */}
                                </div>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`font-medium underline ${own ? 'text-cyan-100' : 'text-cyan-700'}`}
                                >
                                  {att.name}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className={`mt-2 text-[11px] ${own ? 'text-cyan-100/80' : 'text-slate-400'}`}>
                        {formatMessageTime(m.timestamp || m.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        {attachments.length > 0 ? (
          <div className="mb-3 space-y-3">
            {imageAttachments.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {attachments.map((att, idx) =>
                  att.mimeType?.startsWith('image/') ? (
                    <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                        aria-label={`Remove ${att.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={att.url} alt={att.name} className="h-28 w-28 object-cover" />
                      <div className="max-w-28 px-2 py-1 text-[11px] text-slate-600 truncate">{att.name}</div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}

            {attachments.some((att) => !att.mimeType?.startsWith('image/')) ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) =>
                  !att.mimeType?.startsWith('image/') ? (
                    <div key={idx} className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2">
                      <div className="text-xs">{att.name}</div>
                      <button onClick={() => removeAttachment(idx)} className="text-xs text-rose-600">
                        Remove
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="rounded-lg border px-3 py-2">{uploading ? <Loader /> : <Paperclip />}</button>
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-lg border px-3 py-2" />
          <button onClick={sendMessage} className="rounded-lg bg-cyan-600 px-4 py-2 text-white">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
