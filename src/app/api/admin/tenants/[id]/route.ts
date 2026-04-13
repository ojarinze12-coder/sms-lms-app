import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional().nullable(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  brandColor: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  const isAuthenticated = !!authUser;

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Super Admin access required', isAuthenticated: false }, { status: 401 });
  }

  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found', isAuthenticated: true }, { status: 404 });
    }

    const [studentCount, teacherCount, userCount, courseCount, subscriptions, tenantConfig, tenantHealth, recentActivity] = await Promise.all([
      prisma.student.count({ where: { tenantId: id } }),
      prisma.teacher.count({ where: { tenantId: id } }),
      prisma.user.count({ where: { tenantId: id } }),
      prisma.course.count({ where: { tenantId: id } }),
      prisma.subscription.findMany({
        where: { tenantId: id },
        include: { subscriptionPlan: true },
      }),
      prisma.tenantConfig.findUnique({ where: { tenantId: id } }),
      prisma.tenantHealth.findUnique({ where: { tenantId: id } }),
      prisma.platformAuditLog.findMany({
        where: {
          targetType: 'tenant',
          targetId: id,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      tenant: {
        ...tenant,
        _count: {
          students: studentCount,
          teachers: teacherCount,
          users: userCount,
          courses: courseCount,
        },
        subscriptions,
        tenantConfig,
        tenantHealth,
      },
      recentActivity,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Admin Tenant GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: validatedData,
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'TENANT_UPDATED',
        actionType: 'UPDATE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: tenant.id,
        targetName: tenant.name,
        description: `Updated tenant: ${tenant.name}`,
        changes: validatedData,
      },
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant PUT error:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (hardDelete) {
      await prisma.tenant.delete({ where: { id } });
    } else {
      await prisma.tenant.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: hardDelete ? 'TENANT_DELETED' : 'TENANT_SUSPENDED',
        actionType: 'DELETE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `${hardDelete ? 'Permanently deleted' : 'Suspended'} tenant: ${tenant.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Tenant DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}
