import { NextResponse } from 'next/server';

import { proxyJsonToBackend } from '@/lib/server-api';

function buildDraftPath(request: Request) {
  const url = new URL(request.url);
  const query = url.search;
  return `/product-drafts/me${query}`;
}

export async function GET(request: Request) {
  try {
    const { response, data } = await proxyJsonToBackend(buildDraftPath(request), {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to load the draft.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load the draft.' },
      { status: 401 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await proxyJsonToBackend('/product-drafts/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to save the draft.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save the draft.' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { response, data } = await proxyJsonToBackend(buildDraftPath(request), {
      method: 'DELETE',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Unable to clear the draft.' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to clear the draft.' },
      { status: 400 },
    );
  }
}