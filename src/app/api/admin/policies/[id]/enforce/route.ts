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

    const policy = await prisma.globalPolicy.findUnique({ where: { id } });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        ...(policy.appliesTo.includes('ENTERPRISE_ONLY') 
          ? { plan: 'ENTERPRISE' } 
          : {}),
      },
    });

    await prisma.globalPolicy.update({
      where: { id },
      data: {
        isEnforced: true,
        enforcedAt: new Date(),
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'POLICY_ENFORCED',
        actionType: 'ENABLE',
        category: 'SECURITY',
        targetType: 'policy',
        targetId: id,
        targetName: policy.name,
        description: `Enforced global policy: ${policy.name} on ${tenants.length} tenants`,
        metadata: { affectedTenants: tenants.length },
      },
    });

    return NextResponse.json({
      success: true,
      policy: {
        ...policy,
        isEnforced: true,
        enforcedAt: new Date(),
      },
      affectedTenants: tenants.length,
    });
  } catch (error) {
    console.error('Admin Policy Enforce error:', error);
    return NextResponse.json({ error: 'Failed to enforce policy' }, { status: 500 });
  }
}
