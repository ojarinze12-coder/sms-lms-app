import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

function getTokenFromRequest(request: NextRequest): string | null {
  const pccToken = request.cookies.get('pcc-token')?.value;
  const sccToken = request.cookies.get('scc-token')?.value;
  const legacyToken = request.cookies.get('auth-token')?.value;

  return pccToken || sccToken || legacyToken || null;
}

function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/login',
    '/register',
    '/apply',
    '/api/auth/login',
    '/api/auth/register',
    '/_next',
    '/favicon.ico',
  ];

  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/_next/')) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyToken(token);

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('pcc-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('scc-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', payload.role);
  response.headers.set('x-tenant-id', payload.tenantId || '');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
