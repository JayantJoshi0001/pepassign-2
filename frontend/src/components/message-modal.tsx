'use client';

import { FormEvent, useState } from 'react';

interface MessageModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onSend: (text: string) => Promise<void>;
  loading: boolean;
}

export function MessageModal({
  isOpen,
  onCancel,
  onSend,
  loading,
}: MessageModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }

    await onSend(text.trim());
    setText('');
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-100 bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-slate-900">Talk with me python</h2>
        <p className="mt-2 text-sm text-slate-600">
          Send a message and the NestJS backend will relay it to FastAPI.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write your message..."
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
