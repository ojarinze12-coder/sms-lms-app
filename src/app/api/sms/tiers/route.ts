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

    const tenantId = user.tenantId;

    const tiers = await prisma.tier.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            classes: true,
            departments: true,
          },
        },
      },
    });

    return NextResponse.json({ data: tiers });
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

    // Check if code already exists for this tenant
    const existingTier = await prisma.tier.findUnique({
      where: {
        tenantId_code: { tenantId, code },
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
