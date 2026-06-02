import { NextResponse } from 'next/server';
import { getBackendBaseUrl, getAuthToken } from '@/lib/server-api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const backendBaseUrl = getBackendBaseUrl();
  const backendUrl = `${backendBaseUrl}/conversations/${id}/attachments`;

  const headers: HeadersInit = {};
  // forward content-type if present (multipart/form-data boundary)
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers,
    duplex: 'half',
    body: request.body,
  });

  const data = await response.json().catch(() => ({}));

  // rewrite returned file URL to a browser-safe frontend proxy URL if present
  if (data && data.url && typeof data.url === 'string') {
    const filename = data.url.split('/').pop();
    data.url = filename ? `/api/conversations/files/${filename}` : data.url;
  }

  return NextResponse.json(data, { status: response.status });
}
