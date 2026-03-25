import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to update user status:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
