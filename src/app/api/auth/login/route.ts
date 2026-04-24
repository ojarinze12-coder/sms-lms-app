import { NextRequest, NextResponse } from 'next/server';
import { createToken, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, studentId, loginType } = body;

    // Handle Student Login
    if (loginType === 'student' && studentId) {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentId: studentId },
            { email: studentId }  // Also allow email as lookup
          ]
        }
      });

      if (!student || !student.userId) {
        return NextResponse.json(
          { error: 'Student account not found. Please contact your school administrator.' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: student.userId },
        include: { tenant: true, branch: true }
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

      console.log('[login] Student login:', student.studentId, 'user:', user.email);

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
          studentId: student.studentId
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
    }

    // Handle Admin/Staff Login (existing flow)
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

    const isSuperAdmin = user.role === 'SUPER_ADMIN';

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

    console.log('[login] User role:', user.role, 'for email:', user.email);

    const cookieName = isSuperAdmin ? 'pcc-token' : 'scc-token';
    const isProduction = process.env.NODE_ENV === 'production';

    const responseBody = {
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
    };

    const response = NextResponse.json(responseBody);
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

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