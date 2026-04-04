import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

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
    const gender = searchParams.get('gender');
    const roomType = searchParams.get('roomType');

    const hostels = await prisma.hostel.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...(hostelId ? { id: hostelId } : {}),
        ...(gender && gender !== 'MIXED' ? { type: { in: ['MIXED', gender] } } : {}),
      },
      include: {
        rooms: {
          where: { status: 'ACTIVE' },
          include: {
            beds: {
              where: { status: 'AVAILABLE' },
              orderBy: { bedNo: 'asc' },
            },
          },
        },
      },
    });

    const availableBeds = [];
    for (const hostel of hostels) {
      for (const room of hostel.rooms) {
        if (roomType && room.roomType !== roomType) continue;
        for (const bed of room.beds) {
          availableBeds.push({
            hostel: { id: hostel.id, name: hostel.name, type: hostel.type },
            room: { id: room.id, roomNo: room.roomNo, floor: room.floor, roomType: room.roomType },
            bed: { id: bed.id, bedNo: bed.bedNo },
          });
        }
      }
    }

    return NextResponse.json(availableBeds);
  } catch (error) {
    console.error('Available beds GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}