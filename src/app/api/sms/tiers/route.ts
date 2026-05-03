import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { CreateTierSchema, ApplyTierTemplateSchema } from '@/lib/schemas/tier';
import { TIER_TEMPLATES } from '@/lib/constants/tiers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const tenantId = user.tenantId;

    const whereClause: any = { tenantId };
    if (branchId) {
      whereClause.branchId = { in: [branchId, null] };
    }

    const tiers = await prisma.tier.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
    });

    // Get department counts separately
    const tierIds = tiers.map(t => t.id);
    const deptCounts = tierIds.length > 0 ? await prisma.department.groupBy({
      by: ['tierId'],
      where: { tierId: { in: tierIds } },
      _count: true,
    }) : [];

    // Get class counts per tier, filtered by branch and academic year
    const classCounts = await prisma.academicClass.groupBy({
      by: ['tierId'],
      where: {
        tierId: { in: tierIds },
        ...(academicYearId ? { academicYearId } : {}),
        ...(branchId ? { branchId: { in: [branchId, null] } } : {}),
      },
      _count: true,
    });

    const deptCountMap = new Map(deptCounts.map(d => [d.tierId, d._count]));
    const classCountMap = new Map(classCounts.map(c => [c.tierId, c._count]));
    const tiersWithClassCount = tiers.map(tier => ({
      ...tier,
      _count: {
        departments: deptCountMap.get(tier.id) || 0,
        classes: classCountMap.get(tier.id) || 0,
      },
    }));

    return NextResponse.json({ data: tiersWithClassCount });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = user.tenantId;
    const body = await request.json();
    const branchId = body.branchId || null;

    // Check if applying a template
    if (body.template) {
      const templateValidation = ApplyTierTemplateSchema.safeParse(body);
      if (!templateValidation.success) {
        return NextResponse.json(
          { error: 'Invalid template data', details: templateValidation.error.flatten() },
          { status: 400 }
        );
      }

      const template = TIER_TEMPLATES[body.template as keyof typeof TIER_TEMPLATES];
      if (!template) {
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
      }

      // Create tiers from template
      const createdTiers = await Promise.all(
        template.map(async (tier) => {
          return prisma.tier.create({
            data: {
              name: tier.name,
              code: tier.code,
              order: tier.order,
              tenantId,
              branchId,
            },
          });
        })
      );

      // Create tier curriculum for each tier
      await Promise.all(
        createdTiers.map((tier) =>
          prisma.tierCurriculum.create({
            data: {
              tierId: tier.id,
              curriculum: body.curriculum || 'NERDC',
              tenantId,
            },
          })
        )
      );

      // Update tenant settings
      await prisma.tenantSettings.upsert({
        where: { tenantId },
        update: { tiersSetupComplete: true },
        create: {
          tenantId,
          curriculumType: body.curriculum || 'NERDC',
          tiersSetupComplete: true,
        },
      });

      return NextResponse.json({ 
        message: 'Tiers created from template',
        data: createdTiers 
      }, { status: 201 });
    }

    // Create single tier
    const validation = CreateTierSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tier data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, code, alias, order } = validation.data;

    // Check if code already exists for this tenant (considering branch)
    const existingTier = await prisma.tier.findFirst({
      where: {
        tenantId,
        code,
        OR: [
          { branchId },
          { branchId: null },
        ],
      },
    });

    if (existingTier) {
      return NextResponse.json(
        { error: 'Tier with this code already exists' },
        { status: 409 }
      );
    }

    const tier = await prisma.tier.create({
      data: {
        name,
        code,
        alias,
        order,
        tenantId,
        branchId,
      },
    });

    // Create tier curriculum entry
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    await prisma.tierCurriculum.create({
      data: {
        tierId: tier.id,
        curriculum: tenantSettings?.curriculumType || 'NERDC',
        tenantId,
      },
    });

    return NextResponse.json({ data: tier }, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
