import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createBadgeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  criteria: z.any().optional(),
  points: z.number().default(0),
  isGlobal: z.boolean().default(true),
  tierId: z.string().uuid().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('tierId');
    const studentId = searchParams.get('studentId');
    const includeGlobal = searchParams.get('includeGlobal') !== 'false';

    // Get badges filtered by tier
    let badgeWhere: any = {
      OR: [
        { tenantId: authUser.tenantId },
        { tenantId: null }, // Global system badges
      ]
    };

    if (tierId) {
      if (includeGlobal) {
        badgeWhere = {
          OR: [
            { tierId }, // Tier-specific badges
            { isGlobal: true, tenantId: authUser.tenantId }, // Global badges
            { isGlobal: true, tenantId: null }, // System global badges
          ]
        };
      } else {
        badgeWhere = { tierId };
      }
    }

    const badges = await prisma.badge.findMany({
      where: badgeWhere,
      include: {
        _count: { select: { students: true } },
        tier: { select: { id: true, name: true, code: true } },
      },
      orderBy: [
        { isGlobal: 'desc' },
        { name: 'asc' },
      ],
    });

    // If studentId provided, get which badges they've earned
    let studentBadges: string[] = [];
    if (studentId) {
      const earned = await prisma.studentBadge.findMany({
        where: { studentId },
        select: { badgeId: true },
      });
      studentBadges = earned.map(sb => sb.badgeId);
    }

    const result = badges.map(badge => ({
      ...badge,
      isEarned: studentBadges.includes(badge.id),
      earnedCount: badge._count.students,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createBadgeSchema.parse(body);

    const badge = await prisma.badge.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        criteria: data.criteria,
        points: data.points,
        isGlobal: data.isGlobal,
        tierId: data.tierId,
        tenantId: authUser.tenantId,
      },
      include: {
        tier: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Badge POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
