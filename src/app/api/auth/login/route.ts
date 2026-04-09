import { NextRequest, NextResponse } from 'next/server';
import { createToken, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    console.log('[LOGIN] User tenantId:', user.tenantId, 'role:', user.role);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const token = createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      tokenVersion: updatedUser.tokenVersion,
    });

    console.log('[LOGIN] Token created with tenantId:', user.tenantId || undefined);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: user.tenant,
      },
    });

    const cookieName = isSuperAdmin ? 'pcc-token' : 'scc-token';
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Clear the opposite cookie to prevent conflicts when switching between PCC/SCC
    const otherCookieName = isSuperAdmin ? 'scc-token' : 'pcc-token';
    response.cookies.set(otherCookieName, '', { maxAge: 0, path: '/' });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
