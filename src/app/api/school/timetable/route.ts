import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { academicClassId: classId },
      include: { subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { academicClassId, dayOfWeek, period, startTime, endTime, subjectId, teacherId } = body;

    if (!academicClassId || !subjectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        academicClassId,
        dayOfWeek,
        period,
        startTime,
        endTime,
        subjectId,
        teacherId,
      },
      include: { subject: true },
    });

    return NextResponse.json({ slot });
  } catch (error: any) {
    console.error('Error saving timetable slot:', error);
    return NextResponse.json({ error: 'Failed to save slot' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get('id');

    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    }

    await prisma.timetableSlot.delete({ where: { id: slotId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting slot:', error);
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  }
}