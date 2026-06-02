import { NextResponse } from 'next/server';

import { getAuthToken, getBackendBaseUrl, proxyJsonToBackend } from '@/lib/server-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { response, data } = await proxyJsonToBackend(`/conversations/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to load conversation.' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Unable to load conversation.',
      },
      { status: 401 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${getBackendBaseUrl()}/conversations/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Unable to delete conversation.',
      },
      { status: 500 },
    );
  }
}
