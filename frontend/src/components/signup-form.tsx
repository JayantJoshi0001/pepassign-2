'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { apiPost } from '@/lib/api';

import { z } from 'zod';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email address').refine((value) => /@gmail\.com$/i.test(value), {
    message: 'Email must be a Gmail address',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const SIGNUP_DRAFT_KEY = 'pepassign.signup.draft';

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedDraft = window.localStorage.getItem(SIGNUP_DRAFT_KEY);

      if (storedDraft) {
        try {
          const parsedDraft = JSON.parse(storedDraft) as {
            username?: string;
            email?: string;
            password?: string;
          };

          setUsername(parsedDraft.username ?? '');
          setEmail(parsedDraft.email ?? '');
          setPassword(parsedDraft.password ?? '');
        } catch {
          window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
        }
      }

      setHydrated(true);
    }, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SIGNUP_DRAFT_KEY) {
        return;
      }

      if (!event.newValue) {
        setUsername('');
        setEmail('');
        setPassword('');
        return;
      }

      try {
        const parsedDraft = JSON.parse(event.newValue) as {
          username?: string;
          email?: string;
          password?: string;
        };

        setUsername(parsedDraft.username ?? '');
        setEmail(parsedDraft.email ?? '');
        setPassword(parsedDraft.password ?? '');
      } catch {
        window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const hasDraft = [username, email, password].some((value) => value.trim().length > 0);

    const timeout = window.setTimeout(() => {
      if (!hasDraft) {
        window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
        return;
      }

      window.localStorage.setItem(
        SIGNUP_DRAFT_KEY,
        JSON.stringify({ username, email, password }),
      );
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [email, hydrated, password, username]);

  function clearDraft() {
    window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const result = signupSchema.safeParse({ username, email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await apiPost<{
        username: string;
        email: string;
        onboardingComplete: boolean;
      }>('/api/auth/register', { username, email, password });
      clearDraft();
      router.push(response.onboardingComplete ? '/dashboard' : '/signup/business');
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create your account right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Username
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Gmail address
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
