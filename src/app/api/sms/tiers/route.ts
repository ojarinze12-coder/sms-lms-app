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

    console.log('[TIERS] branchId param:', branchId);

    // Query tiers for tenant without branch filtering
    const tiers = await prisma.tier.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    });

    console.log('[TIERS] tiers found:', tiers.length);

    // Get department counts separately
    const tierIds = tiers.map(t => t.id);
    const deptCounts = tierIds.length > 0 ? await prisma.department.groupBy({
      by: ['tierId'],
      where: { tierId: { in: tierIds } },
      _count: true,
    }) : [];

    // Get class counts per tier
    let classCounts: any[] = [];
    if (tierIds.length > 0) {
      classCounts = await prisma.academicClass.groupBy({
        by: ['tierId'],
        where: {
          tierId: { in: tierIds },
          ...(academicYearId ? { academicYearId } : {}),
        },
        _count: true,
      });
    }

    const deptCountMap = new Map(deptCounts.map(d => [d.tierId, d._count]));
    const classCountMap = new Map(classCounts.map(c => [c.tierId, c._count]));
    const tiersWithCounts = tiers.map(tier => ({
      ...tier,
      _count: {
        departments: deptCountMap.get(tier.id) || 0,
        classes: classCountMap.get(tier.id) || 0,
      },
    }));

    return NextResponse.json({ data: tiersWithCounts });
  } catch (error: any) {
    console.error('[TIERS GET] Error:', error.message || error);
    console.error('[TIERS GET] Stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }, { status: 500 });
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

    const body = await request.json();
    const validation = CreateTierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tier data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existingTier = await prisma.tier.findFirst({
      where: { tenantId: user.tenantId, code: validation.data.code },
    });

    if (existingTier) {
      return NextResponse.json(
        { error: 'A tier with this code already exists' },
        { status: 400 }
      );
    }

    const tier = await prisma.tier.create({
      data: {
        ...validation.data,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json({ data: tier });
  } catch (error: any) {
    console.error('[TIERS POST] Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}