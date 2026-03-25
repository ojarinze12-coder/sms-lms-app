import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
  }

  try {
    const schools = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        plan: true,
        brandColor: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Admin Schools error:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}
