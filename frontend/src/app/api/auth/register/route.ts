import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

interface RegisterRequestBody {
  username?: string;
  password?: string;
}

interface BackendRegisterResponse {
  accessToken: string;
  username: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRequestBody;
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' },
      { status: 500 },
    );
  }

  const backendResponse = await fetch(`${backendBaseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const responseBody = (await backendResponse
    .json()
    .catch(() => ({}))) as Partial<BackendRegisterResponse> & { message?: string };

  if (!backendResponse.ok || !responseBody.accessToken || !responseBody.username) {
    return NextResponse.json(
      { message: responseBody.message ?? 'Unable to create account.' },
      { status: backendResponse.status || 400 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, responseBody.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });
  cookieStore.set('pepassign_username', responseBody.username, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });

  return NextResponse.json({ username: responseBody.username });
}
