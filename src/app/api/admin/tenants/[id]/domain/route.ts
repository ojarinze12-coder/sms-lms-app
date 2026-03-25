import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const domainSchema = z.object({
  customDomain: z.string().optional(),
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

    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId: id },
      select: {
        customDomain: true,
        domainVerified: true,
        domainVerifiedAt: true,
      },
    });

    return NextResponse.json({ 
      domain: config?.customDomain,
      verified: config?.domainVerified || false,
      verifiedAt: config?.domainVerifiedAt,
    });
  } catch (error) {
    console.error('Admin Tenant Domain GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch domain' }, { status: 500 });
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
    const { customDomain } = domainSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (customDomain) {
      const existing = await prisma.tenantConfig.findFirst({
        where: {
          customDomain,
          NOT: { tenantId: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 400 }
        );
      }
    }

    await prisma.tenant.update({
      where: { id },
      data: { domain: customDomain || null },
    });

    const config = await prisma.tenantConfig.upsert({
      where: { tenantId: id },
      update: {
        customDomain: customDomain || null,
        domainVerified: false,
      },
      create: {
        tenantId: id,
        customDomain: customDomain || null,
        domainVerified: false,
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'TENANT_DOMAIN_UPDATED',
        actionType: 'UPDATE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `Updated custom domain for ${tenant.name}: ${customDomain || 'removed'}`,
      },
    });

    return NextResponse.json({ 
      domain: config.customDomain,
      verified: config.domainVerified,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant Domain PUT error:', error);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

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

    const config = await prisma.tenantConfig.update({
      where: { tenantId: id },
      data: {
        domainVerified: true,
        domainVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      verified: config.domainVerified,
      verifiedAt: config.domainVerifiedAt,
    });
  } catch (error) {
    console.error('Admin Tenant Domain Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
  }
}
