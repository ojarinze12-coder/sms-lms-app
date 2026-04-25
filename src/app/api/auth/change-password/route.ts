import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { comparePassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Find user by role and update password
    let user;
    
    if (authUser.role === 'STUDENT') {
      user = await prisma.student.findUnique({
        where: { id: authUser.userId }
      });
    } else if (authUser.role === 'TEACHER') {
      user = await prisma.teacher.findUnique({
        where: { id: authUser.userId }
      });
    } else if (authUser.role === 'PARENT') {
      user = await prisma.parent.findUnique({
        where: { id: authUser.userId }
      });
    } else if (authUser.role === 'ADMIN' || authUser.role === 'SCHOOL_OWNER') {
      user = await prisma.user.findUnique({
        where: { id: authUser.userId }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has a password set, verify current password
    if (user.password) {
      const isValid = comparePassword(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
    }

    // Hash and update new password
    const hashedPassword = hashPassword(newPassword);

    if (authUser.role === 'STUDENT') {
      await prisma.student.update({
        where: { id: authUser.userId },
        data: { password: hashedPassword }
      });
    } else if (authUser.role === 'TEACHER') {
      await prisma.teacher.update({
        where: { id: authUser.userId },
        data: { password: hashedPassword }
      });
    } else if (authUser.role === 'PARENT') {
      await prisma.parent.update({
        where: { id: authUser.userId },
        data: { password: hashedPassword }
      });
    } else {
      await prisma.user.update({
        where: { id: authUser.userId },
        data: { password: hashedPassword }
      });
    }

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}