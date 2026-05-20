import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from './src/lib/constants';

function getBackendBaseUrl() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backendBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
  }

  return backendBaseUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/signup/business');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const backendResponse = await fetch(`${getBackendBaseUrl()}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!backendResponse.ok) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const currentUser = (await backendResponse.json().catch(() => ({}))) as {
    onboardingComplete?: boolean;
  };

  if (!currentUser.onboardingComplete && pathname !== '/signup/business') {
    return NextResponse.redirect(new URL('/signup/business', request.url));
  }

  if (currentUser.onboardingComplete && pathname.startsWith('/signup/business')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/products/:path*', '/signup/business/:path*'],
};
