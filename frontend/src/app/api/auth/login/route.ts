import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

interface LoginRequestBody {
  username?: string;
  password?: string;
}

interface BackendLoginResponse {
  accessToken: string;
  username: string;
  email: string;
  onboardingComplete: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequestBody;
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' },
      { status: 500 },
    );
  }

  const backendResponse = await fetch(`${backendBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const responseBody = (await backendResponse
    .json()
    .catch(() => ({}))) as Partial<BackendLoginResponse> & { message?: string };

  if (
    !backendResponse.ok ||
    !responseBody.accessToken ||
    !responseBody.username ||
    !responseBody.email
  ) {
    return NextResponse.json(
      { message: responseBody.message ?? 'Invalid username or password.' },
      { status: backendResponse.status || 401 },
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

  return NextResponse.json({
    username: responseBody.username,
    email: responseBody.email,
    onboardingComplete: responseBody.onboardingComplete,
  });
}
