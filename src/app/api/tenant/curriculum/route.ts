import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { TenantCurriculumSettingsSchema } from '@/lib/schemas/tier';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    // Get tier-specific curriculum if enabled
    let tierCurriculum: { tierId: string; curriculum: string }[] = [];
    
    if (settings?.usePerTierCurriculum) {
      const curricula = await prisma.tierCurriculum.findMany({
        where: { tenantId },
        include: { tier: { select: { name: true, code: true } } },
      });
      tierCurriculum = curricula;
    }

    // Get all tiers for display
    const tiers = await prisma.tier.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      include: {
        tierCurriculum: true,
      },
    });

    return NextResponse.json({
      data: {
        settings,
        tiers,
        tierCurriculum,
      },
    });
  } catch (error) {
    console.error('Error fetching curriculum settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const validation = TenantCurriculumSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      curriculumType, 
      usePerTierCurriculum,
      daysPerWeek,
      periodDuration,
      schoolStartTime,
      schoolEndTime,
      breakStartTime,
      breakEndTime
    } = validation.data;

    // Upsert tenant settings
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        curriculumType,
        usePerTierCurriculum,
        daysPerWeek,
        periodDuration,
      },
      create: {
        tenantId,
        curriculumType,
        usePerTierCurriculum,
        daysPerWeek,
        periodDuration,
        tiersSetupComplete: false,
      },
    });

    // If not using per-tier curriculum, update all tier curricula to match
    if (!usePerTierCurriculum) {
      await prisma.tierCurriculum.updateMany({
        where: { tenantId },
        data: { curriculum: curriculumType },
      });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error updating curriculum settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
