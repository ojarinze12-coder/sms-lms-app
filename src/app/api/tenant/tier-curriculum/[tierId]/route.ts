import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { TierCurriculumSchema } from '@/lib/schemas/tier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tierId: string }> }
) {
  try {
    const user = await getAuthUser();
    const { tierId } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tierCurriculum = await prisma.tierCurriculum.findUnique({
      where: { tierId },
      include: {
        tier: { select: { name: true, code: true } },
      },
    });

    if (!tierCurriculum) {
      return NextResponse.json({ error: 'Tier curriculum not found' }, { status: 404 });
    }

    if (tierCurriculum.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: tierCurriculum });
  } catch (error) {
    console.error('Error fetching tier curriculum:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tierId: string }> }
) {
  try {
    const user = await getAuthUser();
    const { tierId } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = user.tenantId;

    // Verify tier belongs to tenant
    const tier = await prisma.tier.findUnique({ where: { id: tierId } });
    if (!tier || tier.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = TierCurriculumSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tier curriculum data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Ensure tenant has per-tier curriculum enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.usePerTierCurriculum) {
      return NextResponse.json(
        { error: 'Enable per-tier curriculum in settings first' },
        { status: 400 }
      );
    }

    const tierCurriculum = await prisma.tierCurriculum.upsert({
      where: { tierId },
      update: { curriculum: validation.data.curriculum },
      create: {
        tierId,
        curriculum: validation.data.curriculum,
        tenantId,
      },
    });

    return NextResponse.json({ data: tierCurriculum });
  } catch (error) {
    console.error('Error updating tier curriculum:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
