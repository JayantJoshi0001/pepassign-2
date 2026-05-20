import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME } from './constants';

export function getBackendBaseUrl() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backendBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
  }

  return backendBaseUrl;
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function proxyJsonToBackend<TResponse>(
  path: string,
  init: RequestInit,
): Promise<{ response: Response; data: TResponse & { message?: string } }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Unauthorized.');
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & {
    message?: string;
  };

  return { response, data };
}