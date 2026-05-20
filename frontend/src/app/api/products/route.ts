import { NextResponse } from 'next/server';

import { proxyJsonToBackend } from '@/lib/server-api';

export async function GET() {
  try {
    const { response, data } = await proxyJsonToBackend('/products', { method: 'GET' });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to load products.' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load products.' },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await proxyJsonToBackend('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to create product.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to create product.' },
      { status: 400 },
    );
  }
}