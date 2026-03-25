import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const timetableSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  period: z.number().min(1).max(10),
  subject: z.string(),
  teacher: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const saveTimetableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  academicYearId: z.string().uuid('Invalid academic year ID').optional().nullable(),
  academicClassId: z.string().uuid('Invalid class ID').optional().nullable(),
  isPublished: z.boolean().default(false),
  slots: z.array(timetableSlotSchema).min(1, 'At least one slot is required'),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = saveTimetableSchema.parse(body);

    let academicYearId = validatedData.academicYearId;
    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { tenantId: authUser.tenantId, isActive: true }
      });
      academicYearId = activeYear?.id;
    }

    if (!academicYearId) {
      return NextResponse.json({ error: 'No active academic year found' }, { status: 400 });
    }

    const existingTimetable = await prisma.timetable.findFirst({
      where: {
        academicYearId,
        name: validatedData.name,
      },
    });

    const clampDayOfWeek = (day: number) => Math.max(0, Math.min(4, day));
    const clampPeriod = (period: number) => Math.max(1, Math.min(6, period));

    // Deduplicate slots - keep first occurrence for each day/period combination
    const seen = new Set<string>();
    const uniqueSlots = validatedData.slots.filter(slot => {
      const key = `${clampDayOfWeek(slot.dayOfWeek)}-${clampPeriod(slot.period)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniqueSlots.length === 0) {
      return NextResponse.json({ error: 'No valid timetable slots after deduplication' }, { status: 400 });
    }

    let timetable;
    if (existingTimetable) {
      await prisma.timetableSlot.deleteMany({
        where: { timetableId: existingTimetable.id }
      });
      
      timetable = await prisma.timetable.update({
        where: { id: existingTimetable.id },
        data: {
          isPublished: validatedData.isPublished,
          slots: {
            create: uniqueSlots.map(slot => ({
              dayOfWeek: clampDayOfWeek(slot.dayOfWeek),
              period: clampPeriod(slot.period),
              subjectId: null,
              teacherId: null,
              startTime: slot.startTime,
              endTime: slot.endTime,
              academicClassId: validatedData.academicClassId || null,
            })),
          },
        },
        include: {
          slots: true,
          academicYear: true,
        },
      });
    } else {
      timetable = await prisma.timetable.create({
        data: {
          name: validatedData.name,
          academicYearId,
          isPublished: validatedData.isPublished,
          slots: {
            create: uniqueSlots.map(slot => ({
              dayOfWeek: clampDayOfWeek(slot.dayOfWeek),
              period: clampPeriod(slot.period),
              subjectId: null,
              teacherId: null,
              startTime: slot.startTime,
              endTime: slot.endTime,
              academicClassId: validatedData.academicClassId || null,
            })),
          },
        },
        include: {
          slots: true,
          academicYear: true,
        },
      });
    }

    return NextResponse.json(timetable, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Save AI Timetable error:', error);
    return NextResponse.json({ error: 'Failed to save timetable: ' + (error?.message || 'Unknown error') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const classId = searchParams.get('classId');

    const where: any = {
      academicYear: { tenantId: authUser.tenantId }
    };

    if (academicYearId) where.academicYearId = academicYearId;

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        academicYear: true,
        slots: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(timetables);
  } catch (error: any) {
    console.error('Get AI Timetables error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'Unknown') }, { status: 500 });
  }
}