import { NextRequest, NextResponse } from 'next/server';
import { createToken, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, studentId, loginType } = body;

    // Handle Student Login (restored from working version 0ad0526)
    if (loginType === 'student' && studentId) {
      // Make studentId lookup flexible - case-insensitive and partial match
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentId: { mode: 'insensitive', equals: studentId.trim() } },
            { studentId: { mode: 'insensitive', contains: studentId.trim() } },
            { email: { mode: 'insensitive', equals: studentId.trim() } }
          ]
        }
      });

      console.log('[login] Student lookup - input:', studentId, 'found:', student?.studentId, 'userId:', student?.userId);

      if (!student) {
        return NextResponse.json(
          { error: 'Student account not found. Please contact your school administrator.' },
          { status: 401 }
        );
      }

      if (!student.userId) {
        return NextResponse.json(
          { error: 'Student account not linked. Please contact your school administrator.' },
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

    // Handle Admin/Staff Login (existing unified flow)
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