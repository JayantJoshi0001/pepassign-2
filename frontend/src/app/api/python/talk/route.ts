import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

interface TalkBody {
  text?: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  if (!backendBaseUrl) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' },
      { status: 500 },
    );
  }

  const body = (await request.json()) as TalkBody;

  const backendResponse = await fetch(`${backendBaseUrl}/python/talk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: body.text }),
  });

  const responseBody = (await backendResponse
    .json()
    .catch(() => ({}))) as { response?: string; message?: string };

  if (!backendResponse.ok || !responseBody.response) {
    return NextResponse.json(
      { message: responseBody.message ?? 'Unable to process your message.' },
      { status: backendResponse.status || 500 },
    );
  }

  return NextResponse.json({ response: responseBody.response });
}
