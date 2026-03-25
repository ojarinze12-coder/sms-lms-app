import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { studentId } = await params;
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { badgeId } = body;

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
    }

    // Get badge info
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: { tier: true },
    });

    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    // Get student's current enrollment/class to determine tier level
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId },
      include: {
        class: {
          include: {
            tier: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tierLevel = enrollment?.class?.level || null;
    const tierName = enrollment?.class?.tier?.name 
      ? `${enrollment.class.tier.name} ${enrollment.class.name}`
      : null;

    // Check if already awarded
    const existing = await prisma.studentBadge.findUnique({
      where: {
        studentId_badgeId: { studentId, badgeId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Badge already awarded to this student' }, { status: 400 });
    }

    // Award the badge
    const studentBadge = await prisma.studentBadge.create({
      data: {
        studentId,
        badgeId,
        tierLevel,
        tierName,
        awardedBy: authUser.userId,
        isAuto: false, // Manual award
      },
      include: {
        badge: { select: { name: true, icon: true, points: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(studentBadge, { status: 201 });
  } catch (error) {
    console.error('Badge award error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { studentId } = await params;
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const badgeId = searchParams.get('badgeId');

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
    }

    await prisma.studentBadge.delete({
      where: {
        studentId_badgeId: { studentId, badgeId }
      }
    });

    return NextResponse.json({ message: 'Badge removed' });
  } catch (error) {
    console.error('Badge removal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
