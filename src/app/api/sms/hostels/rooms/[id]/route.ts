import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateRoomSchema = z.object({
  roomNo: z.string().min(1).optional(),
  floor: z.number().optional(),
  capacity: z.number().optional(),
  roomType: z.string().optional(),
  amenities: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = authUser.tenantId;

    const room = await prisma.hostelRoom.findFirst({
      where: { id, tenantId },
      include: {
        hostel: true,
        beds: {
          orderBy: { bedNo: 'asc' },
        },
        allocations: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            bed: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Hostel room GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = authUser.tenantId;

    const existing = await prisma.hostelRoom.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateRoomSchema.parse(body);

    const room = await prisma.hostelRoom.update({
      where: { id },
      data,
    });

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel room PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = authUser.tenantId;

    const existing = await prisma.hostelRoom.findFirst({
      where: { id, tenantId },
      include: { beds: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const activeAllocations = await prisma.hostelAllocation.count({
      where: { roomId: id, status: 'ACTIVE' },
    });

    if (activeAllocations > 0) {
      return NextResponse.json({ error: 'Cannot delete room with active allocations' }, { status: 400 });
    }

    await prisma.hostelBed.deleteMany({ where: { roomId: id } });
    await prisma.hostelRoom.delete({ where: { id } });

    const hostel = await prisma.hostel.findById(existing.hostelId);
    if (hostel) {
      await prisma.hostel.update({
        where: { id: existing.hostelId },
        data: { totalBeds: hostel.totalBeds - existing.capacity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hostel room DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}