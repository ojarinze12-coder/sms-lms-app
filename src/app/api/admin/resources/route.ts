import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';

    if (view === 'by-tenant') {
      const resources = await prisma.tenantResource.findMany({
        orderBy: { storageUsedBytes: 'desc' },
        take: 50,
      });

      const tenantIds = resources.map(r => r.tenantId);
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true, slug: true, plan: true },
      });
      const tenantMap = new Map(tenants.map(t => [t.id, t]));

      return NextResponse.json({
        resources: resources.map(r => ({
          tenantId: r.tenantId,
          tenantName: tenantMap.get(r.tenantId)?.name,
          tenantSlug: tenantMap.get(r.tenantId)?.slug,
          plan: tenantMap.get(r.tenantId)?.plan,
          storageUsed: Number(r.storageUsedBytes),
          storageLimit: Number(r.storageLimitBytes),
          storagePercent: Number(r.storageUsedBytes) > 0 
            ? (Number(r.storageUsedBytes) / Number(r.storageLimitBytes)) * 100 
            : 0,
          aiCallsUsed: r.aiCallsUsed,
          aiCallsLimit: r.aiCallsLimit,
          apiCallsThisMonth: r.apiCallsThisMonth,
          apiCallsLimit: r.apiCallsLimit,
        })),
      });
    }

    if (view === 'ai-usage') {
      const resources = await prisma.tenantResource.findMany({
        where: {
          aiCallsUsed: { gt: 0 },
        },
        orderBy: { aiCallsUsed: 'desc' },
      });

      const tenantIds = resources.map(r => r.tenantId);
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      });
      const tenantMap = new Map(tenants.map(t => [t.id, t]));

      const totalUsed = resources.reduce((sum, r) => sum + r.aiCallsUsed, 0);
      const totalLimit = resources.reduce((sum, r) => sum + r.aiCallsLimit, 0);

      return NextResponse.json({
        total: {
          used: totalUsed,
          limit: totalLimit,
          percent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
        },
        byTenant: resources.map(r => ({
          tenantId: r.tenantId,
          tenantName: tenantMap.get(r.tenantId)?.name,
          aiCallsUsed: r.aiCallsUsed,
          aiCallsLimit: r.aiCallsLimit,
          aiTokensUsed: r.aiTokensUsed,
          aiTokensLimit: r.aiTokensLimit,
        })),
      });
    }

    if (view === 'storage') {
      const resources = await prisma.tenantResource.findMany({
        where: {
          storageUsedBytes: { gt: 0 },
        },
        orderBy: { storageUsedBytes: 'desc' },
      });

      const tenantIds = resources.map(r => r.tenantId);
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      });
      const tenantMap = new Map(tenants.map(t => [t.id, t]));

      const totalUsed = resources.reduce((sum, r) => sum + Number(r.storageUsedBytes), 0);
      const totalLimit = resources.reduce((sum, r) => sum + Number(r.storageLimitBytes), 0);

      return NextResponse.json({
        total: {
          used: totalUsed,
          limit: totalLimit,
          percent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
          usedGB: (totalUsed / (1024 * 1024 * 1024)).toFixed(2),
          limitGB: (totalLimit / (1024 * 1024 * 1024)).toFixed(2),
        },
        byTenant: resources.map(r => ({
          tenantId: r.tenantId,
          tenantName: tenantMap.get(r.tenantId)?.name,
          storageUsed: Number(r.storageUsedBytes),
          storageLimit: Number(r.storageLimitBytes),
          storageUsedGB: (Number(r.storageUsedBytes) / (1024 * 1024 * 1024)).toFixed(2),
          storageLimitGB: (Number(r.storageLimitBytes) / (1024 * 1024 * 1024)).toFixed(2),
        })),
      });
    }

    const [totalTenants, totalResources] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenantResource.aggregate({
        _sum: {
          storageUsedBytes: true,
          storageLimitBytes: true,
          aiCallsUsed: true,
          aiCallsLimit: true,
          apiCallsThisMonth: true,
        },
      }),
    ]);

    const totalStorageUsed = Number(totalResources._sum.storageUsedBytes || 0);
    const totalStorageLimit = Number(totalResources._sum.storageLimitBytes || 0);

    return NextResponse.json({
      overview: {
        totalTenants,
        storage: {
          used: totalStorageUsed,
          limit: totalStorageLimit,
          percent: totalStorageLimit > 0 ? (totalStorageUsed / totalStorageLimit) * 100 : 0,
          usedGB: (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2),
          limitGB: (totalStorageLimit / (1024 * 1024 * 1024)).toFixed(2),
        },
        ai: {
          used: totalResources._sum.aiCallsUsed || 0,
          limit: totalResources._sum.aiCallsLimit || 0,
          percent: (totalResources._sum.aiCallsLimit || 0) > 0 
            ? ((totalResources._sum.aiCallsUsed || 0) / (totalResources._sum.aiCallsLimit || 1)) * 100 
            : 0,
        },
        api: {
          used: totalResources._sum.apiCallsThisMonth || 0,
          limit: (totalResources._sum as any).apiCallsLimit || 0,
        },
      },
    });
  } catch (error) {
    console.error('Admin Resources GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}
