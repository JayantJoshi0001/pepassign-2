'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiPost } from '@/lib/api';

interface DashboardClientProps {
  username: string;
}

export function DashboardClient({ username }: DashboardClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState('');

  async function sendMessage(text: string) {
    setLoading(true);
    setError('');

    try {
      const result = await apiPost<{ response: string }>('/api/python/talk', { text });
      setMessage(result.response);
      setModalOpen(false);
      setInputText('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send message now.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await apiPost('/api/auth/logout', {});
    router.push('/');
    router.refresh();
  }

  return (
    <section className="w-full max-w-5xl space-y-8 rounded-2xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome, {username}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </div>

      <p className="mt-3 text-slate-600">
        This dashboard calls the backend only. The backend then talks to the Python service.
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/products"
          className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
        >
          Manage products
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen((s) => !s)}
        className="mt-6 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
      >
        Talk with me python
      </button>

      {modalOpen ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!inputText.trim()) return;
            await sendMessage(inputText.trim());
          }}
          className="mt-5"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write your message..."
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />

          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
      ) : null}

      {error ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-emerald-800">Python Response</h2>
          <p className="mt-1 text-sm text-emerald-700">{message}</p>
        </div>
      ) : null}

      {/* Inline input replaces modal to avoid overlay/backdrop */}
    </section>
  );
}
