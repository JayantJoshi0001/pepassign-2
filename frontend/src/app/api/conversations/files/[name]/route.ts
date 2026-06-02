import { NextResponse } from 'next/server';
import { getAuthToken, getBackendBaseUrl } from '@/lib/server-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const backendBaseUrl = getBackendBaseUrl();
    const backendUrl = `${backendBaseUrl}/conversations/files/${encodeURIComponent(name)}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return new NextResponse(body || null, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') ?? 'text/plain',
        },
      });
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
        'Cache-Control': response.headers.get('cache-control') ?? 'private, max-age=0, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to fetch file.' },
      { status: 500 },
    );
  }
}
