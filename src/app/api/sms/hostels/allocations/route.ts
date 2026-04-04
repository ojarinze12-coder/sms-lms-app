import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const allocationSchema = z.object({
  hostelId: z.string().uuid(),
  roomId: z.string().uuid(),
  bedId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  checkInDate: z.string(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get('hostelId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = { tenantId };
    if (hostelId) where.hostelId = hostelId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const allocations = await prisma.hostelAllocation.findMany({
      where,
      include: {
        hostel: true,
        room: true,
        bed: true,
        student: {
          select: { id: true, studentId: true, firstName: true, lastName: true, gender: true },
        },
        academicYear: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Hostel allocation GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const data = allocationSchema.parse(body);

    const [bed, student, hostel] = await Promise.all([
      prisma.hostelBed.findFirst({
        where: { id: data.bedId, status: 'AVAILABLE' },
      }),
      prisma.student.findFirst({
        where: { id: data.studentId, tenantId },
      }),
      prisma.hostel.findFirst({
        where: { id: data.hostelId, tenantId },
      }),
    ]);

    if (!bed) {
      return NextResponse.json({ error: 'Bed not available' }, { status: 400 });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    if (hostel.type !== 'MIXED' && hostel.type !== student.gender) {
      return NextResponse.json({ error: 'Student gender does not match hostel type' }, { status: 400 });
    }

    const existingAllocation = await prisma.hostelAllocation.findFirst({
      where: {
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        status: 'ACTIVE',
      },
    });

    if (existingAllocation) {
      return NextResponse.json({ error: 'Student already has an active allocation' }, { status: 400 });
    }

    const allocation = await prisma.hostelAllocation.create({
      data: {
        hostelId: data.hostelId,
        roomId: data.roomId,
        bedId: data.bedId,
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        checkInDate: new Date(data.checkInDate),
        checkInBy: authUser.email || 'Admin',
        notes: data.notes,
        tenantId,
        status: 'ACTIVE',
      },
    });

    await prisma.hostelBed.update({
      where: { id: data.bedId },
      data: { status: 'OCCUPIED' },
    });

    const occupiedBeds = (hostel.occupiedBeds || 0) + 1;
    await prisma.hostel.update({
      where: { id: data.hostelId },
      data: { occupiedBeds },
    });

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel allocation POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}