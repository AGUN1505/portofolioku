// proxy.ts
// Next.js 16 Root Proxy for Optimistic Navigation Redirects (Layer 1 Defense)
// NOTE: Authoritative authorization is enforced server-side by DAL verifySession().

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { unsealSession, SESSION_COOKIE_NAME } from './src/infrastructure/auth/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const payload = await unsealSession(sessionCookie);
      if (payload && payload.userId) {
        if (!payload.expiresAt || new Date(payload.expiresAt).getTime() > Date.now()) {
          isAuthenticated = true;
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. If accessing /admin/login while already authenticated -> redirect to /admin
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 2. If accessing protected /admin/* routes without active session -> optimistic redirect to /admin/login
  if (pathname.startsWith('/admin') && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
