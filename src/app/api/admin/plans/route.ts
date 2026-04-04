import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  maxStudents: z.number().min(0),
  maxTeachers: z.number().min(0),
  maxStorageGB: z.number().min(0),
  maxAICalls: z.number().min(0),
  features: z.record(z.any()).optional(),
  sortOrder: z.number().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

const DEFAULT_PLANS = [
  {
    name: 'FREE',
    displayName: 'Free',
    description: 'Perfect for small schools getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 50,
    maxTeachers: 5,
    maxStorageGB: 1,
    maxAICalls: 0,
    sortOrder: 1,
    features: {
      basicSMS: true,
      attendance: true,
      feeCollection: false,
      lms: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
      transport: false,
      hostel: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    description: 'For growing schools needing more features',
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    maxStudents: 200,
    maxTeachers: 20,
    maxStorageGB: 5,
    maxAICalls: 50,
    sortOrder: 2,
    features: {
      basicSMS: true,
      attendance: true,
      feeCollection: true,
      lms: true,
      analytics: true,
      prioritySupport: false,
      customBranding: false,
      transport: false,
      hostel: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
  },
  {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    description: 'Complete solution for medium-sized schools',
    monthlyPrice: 35000,
    yearlyPrice: 350000,
    maxStudents: 500,
    maxTeachers: 50,
    maxStorageGB: 20,
    maxAICalls: 200,
    sortOrder: 3,
    features: {
      basicSMS: true,
      attendance: true,
      feeCollection: true,
      lms: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
      transport: true,
      hostel: true,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    description: 'Full-featured solution for large institutions',
    monthlyPrice: 75000,
    yearlyPrice: 750000,
    maxStudents: 999999,
    maxTeachers: 999999,
    maxStorageGB: 100,
    maxAICalls: 999999,
    sortOrder: 4,
    features: {
      basicSMS: true,
      attendance: true,
      feeCollection: true,
      lms: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
      transport: true,
      hostel: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
  },
];

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const plansWithSubscribers = await Promise.all(
      plans.map(async (plan) => {
        const activeSubs = await prisma.subscription.count({
          where: {
            planId: plan.id,
            status: 'ACTIVE',
          },
        });
        return {
          ...plan,
          activeSubscriptions: activeSubs,
        };
      })
    );

    return NextResponse.json({ plans: plansWithSubscribers });
  } catch (error) {
    console.error('Admin Plans GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { name: validatedData.name },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: validatedData as any,
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'PLAN_CREATED',
        actionType: 'CREATE',
        category: 'BILLING',
        targetType: 'plan',
        targetId: plan.id,
        targetName: plan.name,
        description: `Created new plan: ${plan.name}`,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Plans POST error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'seed-defaults') {
      const createdPlans = [];

      for (const planData of DEFAULT_PLANS) {
        const existing = await prisma.subscriptionPlan.findUnique({
          where: { name: planData.name },
        });

        if (!existing) {
          const plan = await prisma.subscriptionPlan.create({ data: planData });
          createdPlans.push(plan);
        }
      }

      return NextResponse.json({
        message: 'Default plans seeded',
        plans: createdPlans.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Plans PUT error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
