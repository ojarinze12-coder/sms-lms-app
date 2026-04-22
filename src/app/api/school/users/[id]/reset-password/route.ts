import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PASSWORD = 'school123';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      message: 'Password reset successfully',
      defaultPassword: DEFAULT_PASSWORD 
    });
  } catch (error) {
    console.error('Failed to reset password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
