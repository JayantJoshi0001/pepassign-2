import { NextResponse } from 'next/server';
import { getAuthToken, getBackendBaseUrl } from '@/lib/server-api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const token = await getAuthToken();
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const backendBaseUrl = getBackendBaseUrl();
    const response = await fetch(`${backendBaseUrl}/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to send message.' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const url = new URL(request.url);
    const before = url.searchParams.get('before');
    const limit = url.searchParams.get('limit') ?? '50';
    const { id } = await params;

    const token = await getAuthToken();
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const backendBaseUrl = getBackendBaseUrl();
    const backendUrl = new URL(`${backendBaseUrl}/conversations/${id}/messages`);
    if (before) backendUrl.searchParams.set('before', before);
    backendUrl.searchParams.set('limit', limit);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to fetch messages.' }, { status: 500 });
  }
}
