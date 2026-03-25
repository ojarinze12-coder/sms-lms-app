import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const isActivate = action === 'activate';
    const newStatus = isActivate ? 'ACTIVE' : 'SUSPENDED';

    await prisma.tenant.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: isActivate ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
        actionType: isActivate ? 'ENABLE' : 'DISABLE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `${isActivate ? 'Activated' : 'Suspended'} tenant: ${tenant.name}`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
    });
  } catch (error) {
    console.error('Admin Tenant Status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
