import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const roomSchema = z.object({
  hostelId: z.string().uuid(),
  roomNo: z.string().min(1),
  floor: z.number().optional().default(1),
  capacity: z.number().optional().default(4),
  roomType: z.string().optional().default('DORMITORY'),
  amenities: z.string().optional(),
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

    const where: any = { tenantId };
    if (hostelId) where.hostelId = hostelId;

    const rooms = await prisma.hostelRoom.findMany({
      where,
      include: {
        hostel: true,
        beds: true,
        _count: {
          select: { allocations: true },
        },
      },
      orderBy: [{ hostel: { name: 'asc' } }, { roomNo: 'asc' }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Hostel room GET error:', error);
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
    const data = roomSchema.parse(body);

    const hostel = await prisma.hostel.findFirst({
      where: { id: data.hostelId, tenantId },
    });

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const room = await prisma.hostelRoom.create({
      data: {
        ...data,
        tenantId,
        status: 'ACTIVE',
      },
    });

    const beds = [];
    for (let i = 1; i <= data.capacity; i++) {
      beds.push({
        roomId: room.id,
        bedNumber: `Bed-${i}`,
        status: 'AVAILABLE',
        tenantId,
      });
    }

    if (beds.length > 0) {
      await prisma.hostelBed.createMany({ data: beds });
    }

    const totalBeds = hostel.totalBeds + data.capacity;
    await prisma.hostel.update({
      where: { id: data.hostelId },
      data: { totalBeds },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel room POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}