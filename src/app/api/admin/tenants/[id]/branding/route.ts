import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const brandingSchema = z.object({
  portalName: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  studentPortalEnabled: z.boolean().optional(),
  parentPortalEnabled: z.boolean().optional(),
  mobileAppEnabled: z.boolean().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    let config = await prisma.tenantConfig.findUnique({
      where: { tenantId: id },
    });

    if (!config) {
      config = await prisma.tenantConfig.create({
        data: { tenantId: id },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Admin Tenant Branding GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
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
    const validatedData = brandingSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    let config = await prisma.tenantConfig.findUnique({
      where: { tenantId: id },
    });

    if (config) {
      config = await prisma.tenantConfig.update({
        where: { tenantId: id },
        data: validatedData,
      });
    } else {
      config = await prisma.tenantConfig.create({
        data: {
          tenantId: id,
          ...validatedData,
        },
      });
    }

    if (validatedData.primaryColor) {
      await prisma.tenant.update({
        where: { id },
        data: { brandColor: validatedData.primaryColor },
      });
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'TENANT_BRANDING_UPDATED',
        actionType: 'UPDATE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `Updated branding for tenant: ${tenant.name}`,
        changes: validatedData,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant Branding PUT error:', error);
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
}
