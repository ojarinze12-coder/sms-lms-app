import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const createBroadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['SYSTEM', 'ANNOUNCEMENT', 'MAINTENANCE', 'FEATURE', 'MARKETING', 'URGENT']),
  targetScope: z.enum(['ALL', 'ALL_ADMINS', 'SPECIFIC_PLANS', 'SPECIFIC_TENANTS']),
  targetPlan: z.string().optional(),
  targetTenantIds: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sent = searchParams.get('sent');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (type) where.type = type;
    if (sent === 'true') where.sentAt = { not: null };
    else if (sent === 'false') where.sentAt = null;

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.broadcast.count({ where }),
    ]);

    return NextResponse.json({
      broadcasts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin Broadcasts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createBroadcastSchema.parse(body);

    let targetTenantIds: string[] = [];
    let totalRecipients = 0;

    if (validatedData.targetScope === 'ALL' || validatedData.targetScope === 'ALL_ADMINS') {
      totalRecipients = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    } else if (validatedData.targetScope === 'SPECIFIC_PLANS' && validatedData.targetPlan) {
      totalRecipients = await prisma.tenant.count({
        where: { plan: validatedData.targetPlan as any, status: 'ACTIVE' },
      });
    } else if (validatedData.targetScope === 'SPECIFIC_TENANTS') {
      targetTenantIds = validatedData.targetTenantIds || [];
      totalRecipients = targetTenantIds.length;
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        targetScope: validatedData.targetScope,
        targetPlan: validatedData.targetPlan,
        targetTenantIds: targetTenantIds,
        totalRecipients,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        sentAt: validatedData.scheduledFor ? null : new Date(),
        createdBy: authUser.userId,
      },
    });

    if (!validatedData.scheduledFor) {
      await sendBroadcast(broadcast);
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'BROADCAST_SENT',
        actionType: 'CREATE',
        category: 'SYSTEM',
        targetType: 'broadcast',
        targetId: broadcast.id,
        targetName: broadcast.title,
        description: `Sent broadcast: ${broadcast.title}`,
        metadata: { recipients: totalRecipients, type: broadcast.type },
      },
    });

    return NextResponse.json({ broadcast }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Broadcasts POST error:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}

async function sendBroadcast(broadcast: any) {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      ...(broadcast.targetScope === 'SPECIFIC_PLANS' && broadcast.targetPlan
        ? { plan: broadcast.targetPlan as any }
        : {}),
      ...(broadcast.targetScope === 'SPECIFIC_TENANTS'
        ? { id: { in: broadcast.targetTenantIds } }
        : {}),
    },
    select: { id: true, name: true },
  });

  for (const tenant of tenants) {
    await prisma.announcement.create({
      data: {
        title: broadcast.title,
        content: broadcast.message,
        type: 'GENERAL',
        targetRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
        priority: broadcast.type === 'URGENT' ? 'HIGH' : 'NORMAL',
        isPublished: true,
        tenantId: tenant.id,
        createdById: broadcast.createdBy,
      },
    });
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: {
      deliveredCount: tenants.length,
      sentAt: new Date(),
    },
  });
}
