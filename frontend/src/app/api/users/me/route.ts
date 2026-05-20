import { NextResponse } from 'next/server';

import { proxyJsonToBackend } from '@/lib/server-api';

export async function GET() {
  try {
    const { response, data } = await proxyJsonToBackend('/users/me', { method: 'GET' });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to load the profile.' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load the profile.' },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await proxyJsonToBackend('/users/me/business', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to update business profile.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update business profile.' },
      { status: 400 },
    );
  }
}