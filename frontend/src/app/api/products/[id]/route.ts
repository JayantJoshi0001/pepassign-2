import { NextResponse } from 'next/server';

import { proxyJsonToBackend } from '@/lib/server-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { response, data } = await proxyJsonToBackend(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to update product.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update product.' },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { response, data } = await proxyJsonToBackend(`/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to delete product.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete product.' },
      { status: 400 },
    );
  }
}