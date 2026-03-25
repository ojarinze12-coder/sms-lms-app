import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, getAuthUser } from '@/lib/auth-server';
import { signToken } from '@/lib/auth';
import { z } from 'zod';

const impersonateSchema = z.object({
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
  duration: z.number().min(1).max(60).default(15),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tenantId } = await params;
    const body = await request.json();
    const { justification, duration } = impersonateSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const existingActiveImpersonation = await prisma.platformAuditLog.findFirst({
      where: {
        actorId: authUser.userId,
        isImpersonation: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveImpersonation) {
      return NextResponse.json(
        { error: 'You already have an active impersonation session' },
        { status: 400 }
      );
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'IMPERSOATION_START',
        actionType: 'LOGIN',
        category: 'SECURITY',
        targetType: 'tenant',
        targetId: tenantId,
        targetName: tenant.name,
        isImpersonation: true,
        justification,
        description: `Started impersonation of tenant: ${tenant.name}`,
      },
    });

    const token = signToken(
      {
        type: 'impersonation',
        originalUserId: authUser.userId,
        originalRole: authUser.role,
        tenantId,
      },
      { expiresIn: `${duration}m` }
    );

    return NextResponse.json({
      success: true,
      token,
      expiresIn: duration * 60,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Impersonate POST error:', error);
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}
