import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

function clearAllAuthCookies(response: NextResponse) {
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('pcc-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('scc-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  console.log('[LOGOUT] Redirecting to:', baseUrl + '/login');
  const response = NextResponse.redirect(new URL('/login', baseUrl));
  clearAllAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const response = NextResponse.redirect(new URL('/login', baseUrl));
  clearAllAuthCookies(response);
  return response;
}