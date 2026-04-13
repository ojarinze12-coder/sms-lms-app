import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
  brandColor: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
});

const updateTenantSchema = createTenantSchema.partial();

const DEFAULT_ONBOARDING_TASKS = [
  { key: 'PROFILE_SETUP', title: 'Complete School Profile' },
  { key: 'ACADEMIC_YEAR', title: 'Create Academic Year' },
  { key: 'CLASSES_CREATED', title: 'Create Classes' },
  { key: 'SUBJECTS_MAPPED', title: 'Map Subjects to Classes' },
  { key: 'TEACHERS_INVITED', title: 'Invite Teachers' },
  { key: 'STUDENTS_IMPORTED', title: 'Import Students' },
  { key: 'PARENTS_LINKED', title: 'Link Parents to Students' },
  { key: 'FEE_STRUCTURE', title: 'Set Up Fee Structure' },
  { key: 'PAYMENT_METHOD', title: 'Connect Payment Gateway' },
  { key: 'TIMETABLE_SETUP', title: 'Create Timetable' },
];

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  const isAuthenticated = !!authUser;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.tenant.count();

    const tenantsWithCounts = await Promise.all(
      tenants.map(async (tenant) => {
        const [studentCount, teacherCount, userCount, subscription, tenantConfig, tenantHealth] = await Promise.all([
          prisma.student.count({ where: { tenantId: tenant.id } }),
          prisma.teacher.count({ where: { tenantId: tenant.id } }),
          prisma.user.count({ where: { tenantId: tenant.id } }),
          prisma.subscription.findFirst({ where: { tenantId: tenant.id }, include: { subscriptionPlan: true } }),
          prisma.tenantConfig.findUnique({ where: { tenantId: tenant.id } }),
          prisma.tenantHealth.findUnique({ where: { tenantId: tenant.id } }),
        ]);

        return {
          ...tenant,
          _count: {
            students: studentCount,
            teachers: teacherCount,
            users: userCount,
          },
          subscription: subscription ? { plan: subscription.subscriptionPlan, status: subscription.status } : null,
          tenantConfig,
          tenantHealth,
        };
      })
    );

    return NextResponse.json({
      tenants: tenantsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      isAuthenticated,
    });
  } catch (error) {
    console.error('Admin Tenants GET error:', error);
    return NextResponse.json({ 
      tenants: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      isAuthenticated,
      error: 'Failed to fetch tenants' 
    });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createTenantSchema.parse(body);

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant with this slug already exists' },
        { status: 400 }
      );
    }

    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { name: 'FREE' },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        domain: validatedData.domain,
        plan: validatedData.plan,
        brandColor: validatedData.brandColor || '#1a56db',
        status: 'ACTIVE',
      },
    });

    await prisma.tenantConfig.create({
      data: {
        tenantId: tenant.id,
        primaryColor: validatedData.brandColor || '#1a56db',
      },
    });

    await prisma.tenantResource.create({
      data: {
        tenantId: tenant.id,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    });

    await prisma.tenantHealth.create({
      data: {
        tenantId: tenant.id,
      },
    });

    if (freePlan) {
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
      });
    }

    for (const task of DEFAULT_ONBOARDING_TASKS) {
      await prisma.onboardingTask.create({
        data: {
          tenantId: tenant.id,
          taskKey: task.key as any,
          title: task.title,
          status: 'PENDING',
          progress: 0,
        },
      });
    }

    const [tenantConfig, tenantHealth, subscriptions] = await Promise.all([
      prisma.tenantConfig.findUnique({ where: { tenantId: tenant.id } }),
      prisma.tenantHealth.findUnique({ where: { tenantId: tenant.id } }),
      prisma.subscription.findMany({
        where: { tenantId: tenant.id },
        include: { subscriptionPlan: true },
      }),
    ]);

    const fullTenant = {
      ...tenant,
      tenantConfig,
      tenantHealth,
      subscriptions,
    };

    return NextResponse.json({ tenant: fullTenant }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Tenants POST error:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
