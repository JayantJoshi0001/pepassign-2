import { NextResponse } from 'next/server';

interface SearchQuery {
  query?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' },
      { status: 500 },
    );
  }

  try {
    const searchUrl = new URL(`${backendBaseUrl}/marketplace/search`);
    if (query) {
      searchUrl.searchParams.set('query', query);
    }

    const backendResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: 'Search failed' },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Search error' },
      { status: 500 },
    );
  }
}
