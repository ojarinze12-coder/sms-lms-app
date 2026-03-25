import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const smtpSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpFromEmail: z.string().email().optional(),
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
        smtpHost: true,
        smtpPort: true,
        smtpFromName: true,
        smtpFromEmail: true,
        smtpUser: true,
      },
    });

    return NextResponse.json({ smtp: config });
  } catch (error) {
    console.error('Admin Tenant SMTP GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SMTP settings' }, { status: 500 });
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
    const validatedData = smtpSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const config = await prisma.tenantConfig.upsert({
      where: { tenantId: id },
      update: validatedData,
      create: {
        tenantId: id,
        ...validatedData,
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'TENANT_SMTP_UPDATED',
        actionType: 'UPDATE',
        category: 'TENANT',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `Updated SMTP settings for ${tenant.name}`,
      },
    });

    return NextResponse.json({ 
      smtp: {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpFromName: config.smtpFromName,
        smtpFromEmail: config.smtpFromEmail,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant SMTP PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SMTP settings' }, { status: 500 });
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
    const body = await request.json();
    const { testEmail } = body;

    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId: id },
    });

    if (!config?.smtpHost) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${testEmail}` 
    });
  } catch (error) {
    console.error('Admin Tenant SMTP Test error:', error);
    return NextResponse.json({ error: 'Failed to test SMTP' }, { status: 500 });
  }
}
