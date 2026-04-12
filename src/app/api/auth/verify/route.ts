import { NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  try {
    // Get Authorization header
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        tenantId: payload.tenantId,
      },
      token,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Also support GET
export async function GET() {
  return POST();
}