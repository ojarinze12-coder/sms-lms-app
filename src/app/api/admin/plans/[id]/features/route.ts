import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const featureSchema = z.object({
  featureKey: z.string(),
  enabled: z.boolean(),
  limit: z.number().optional(),
  overageCost: z.number().optional(),
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
      select: { 
        name: true,
        features: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planFeatures = await prisma.planFeature.findMany({
      where: { planId: id },
    });

    const allFeatures = {
      ...(plan.features as object || {}),
      ...Object.fromEntries(planFeatures.map((f: any) => [f.featureKey, {
        enabled: f.enabled,
        limit: f.limit,
        overageCost: f.overageCost,
      }])),
    };

    return NextResponse.json({ 
      planName: plan.name,
      features: allFeatures,
    });
  } catch (error) {
    console.error('Admin Plan Features GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
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
    const { features } = body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const featureKeys = Array.isArray(features) 
      ? features 
      : Object.keys(features || {});

    for (const key of featureKeys) {
      const featureData = Array.isArray(features) 
        ? { enabled: true, limit: null, overageCost: null }
        : features[key];

      const existingFeature = await prisma.planFeature.findFirst({
        where: { planId: id, featureKey: key },
      });

      if (existingFeature) {
        await prisma.planFeature.update({
          where: { id: existingFeature.id },
          data: {
            enabled: featureData.enabled ?? true,
            limit: featureData.limit,
            overageCost: featureData.overageCost,
          },
        });
      } else {
        await prisma.planFeature.create({
          data: {
            planId: id,
            featureKey: key,
            enabled: featureData.enabled ?? true,
            limit: featureData.limit,
            overageCost: featureData.overageCost,
          },
        });
      }
    }

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'PLAN_FEATURES_UPDATED',
        actionType: 'UPDATE',
        category: 'BILLING',
        targetType: 'plan',
        targetId: id,
        targetName: plan.name,
        description: `Updated features for plan: ${plan.name}`,
        metadata: { featureKeys },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Plan Features PUT error:', error);
    return NextResponse.json({ error: 'Failed to update features' }, { status: 500 });
  }
}
