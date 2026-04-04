import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
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
