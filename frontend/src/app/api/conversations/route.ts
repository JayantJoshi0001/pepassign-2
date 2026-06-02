import { NextResponse } from 'next/server';
import { proxyJsonToBackend } from '@/lib/server-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await proxyJsonToBackend('/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ message: data.message ?? 'Unable to create conversation.' }, { status: response.status || 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to create conversation.' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { response, data } = await proxyJsonToBackend('/conversations', { method: 'GET' });

    if (!response.ok) {
      return NextResponse.json({ message: data.message ?? 'Unable to load conversations.' }, { status: response.status || 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to load conversations.' }, { status: 400 });
  }
}
