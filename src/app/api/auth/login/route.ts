import { NextRequest, NextResponse } from 'next/server';
import { createToken, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Unified login - all users login the same way
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true, branch: true },
    });

    if (!user || !user.password) {
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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const token = createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId || undefined,
      branchId: user.branchId || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      tokenVersion: updatedUser.tokenVersion,
    });

    console.log('[login] User login:', user.email, 'role:', user.role);

    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: user.tenant,
        branch: user.branch,
      },
      token: token,
    });

    response.cookies.set('scc-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.set('pcc-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}