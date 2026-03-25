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
    description: 'Basic features for small schools',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 100,
    maxTeachers: 10,
    maxStorageGB: 1,
    maxAICalls: 0,
    sortOrder: 1,
    features: {
      ai_timetable: false,
      ai_exam_generator: false,
      sms_notifications: false,
      whatsapp_notifications: false,
      custom_domain: false,
      priority_support: false,
      advanced_analytics: false,
      api_access: false,
    },
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    description: 'Essential features for growing schools',
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    maxStudents: 500,
    maxTeachers: 50,
    maxStorageGB: 5,
    maxAICalls: 100,
    sortOrder: 2,
    features: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: false,
      custom_domain: false,
      priority_support: false,
      advanced_analytics: false,
      api_access: false,
    },
  },
  {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    description: 'Full-featured for established schools',
    monthlyPrice: 50000,
    yearlyPrice: 500000,
    maxStudents: 2000,
    maxTeachers: 200,
    maxStorageGB: 25,
    maxAICalls: 500,
    sortOrder: 3,
    features: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: true,
      custom_domain: true,
      priority_support: false,
      advanced_analytics: true,
      api_access: true,
    },
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    description: 'Unlimited for school groups and chains',
    monthlyPrice: 150000,
    yearlyPrice: 1500000,
    maxStudents: 0,
    maxTeachers: 0,
    maxStorageGB: 100,
    maxAICalls: 5000,
    sortOrder: 4,
    features: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: true,
      custom_domain: true,
      priority_support: true,
      advanced_analytics: true,
      api_access: true,
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
