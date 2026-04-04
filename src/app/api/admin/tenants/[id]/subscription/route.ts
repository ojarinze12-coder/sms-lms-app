import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updateSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
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

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: id },
    });

    let subscriptionPlan = null;
    if (subscription?.planId) {
      subscriptionPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription.planId },
      });
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const resources = await prisma.tenantResource.findUnique({
      where: { tenantId: id },
    });

    return NextResponse.json({
      subscription: subscription ? { ...subscription, plan: subscriptionPlan } : null,
      resources,
    });
  } catch (error) {
    console.error('Admin Tenant Subscription GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
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
    const validatedData = updateSubscriptionSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: validatedData.planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const billingCycle = validatedData.billingCycle || 'MONTHLY';
    const periodDays = billingCycle === 'YEARLY' ? 365 : 30;

    const existingSubscription = await prisma.subscription.findFirst({
      where: { tenantId: id },
    });

    let subscription;
    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: validatedData.planId,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          tenantId: id,
          planId: validatedData.planId,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });
    }

    await prisma.tenant.update({
      where: { id },
      data: { plan: plan.name as any },
    });

    const resourceLimits = {
      storageLimitBytes: BigInt(plan.maxStorageGB * 1024 * 1024 * 1024),
      aiCallsLimit: plan.maxAICalls,
    };

    await prisma.tenantResource.upsert({
      where: { tenantId: id },
      update: resourceLimits,
      create: {
        tenantId: id,
        ...resourceLimits,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'TENANT_SUBSCRIPTION_UPDATED',
        actionType: 'UPDATE',
        category: 'BILLING',
        targetType: 'tenant',
        targetId: id,
        targetName: tenant.name,
        description: `Updated subscription for ${tenant.name} to ${plan.name}`,
        metadata: { plan: plan.name, billingCycle },
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenant Subscription PUT error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
