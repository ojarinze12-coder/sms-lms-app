import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { id: studentId } = await params;
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Students can view their own badges, teachers/admins can view any
    if (authUser.role === 'STUDENT' && authUser.userId !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const badges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: {
        badge: {
          include: {
            tier: { select: { name: true, code: true } },
          }
        },
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Calculate total points
    const totalPoints = badges.reduce((sum, sb) => sum + (sb.badge.points || 0), 0);

    return NextResponse.json({
      badges,
      totalPoints,
      badgeCount: badges.length,
    });
  } catch (error) {
    console.error('Student badges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
