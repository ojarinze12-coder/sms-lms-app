import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updatePlanSchema = z.object({
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
  maxStudents: z.number().min(0).optional(),
  maxTeachers: z.number().min(0).optional(),
  maxStorageGB: z.number().min(0).optional(),
  maxAICalls: z.number().min(0).optional(),
  features: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
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

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        planFeatures: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      plan: {
        ...plan,
        activeSubscriptions,
      },
    });
  } catch (error) {
    console.error('Admin Plan GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
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
    const validatedData = updatePlanSchema.parse(body);

    const existingPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: validatedData,
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'PLAN_UPDATED',
        actionType: 'UPDATE',
        category: 'BILLING',
        targetType: 'plan',
        targetId: plan.id,
        targetName: plan.name,
        description: `Updated plan: ${plan.name}`,
        changes: validatedData,
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Plan PUT error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
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

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan._count.subscriptions > 0) {
      await prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await prisma.subscriptionPlan.delete({ where: { id } });
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'PLAN_DELETED',
        actionType: 'DELETE',
        category: 'BILLING',
        targetType: 'plan',
        targetId: id,
        targetName: plan.name,
        description: `Deleted plan: ${plan.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Plan DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
