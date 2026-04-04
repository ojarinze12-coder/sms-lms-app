import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
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

    const allocation = await prisma.hostelAllocation.findFirst({
      where: { id, tenantId },
      include: { bed: true, hostel: true },
    });

    if (!allocation) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }

    if (allocation.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Already checked out' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'checkout') {
      const updated = await prisma.hostelAllocation.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          checkOutDate: new Date(),
          checkOutBy: authUser.email || 'Admin',
        },
      });

      await prisma.hostelBed.update({
        where: { id: allocation.bedId },
        data: { status: 'AVAILABLE' },
      });

      const hostel = await prisma.hostel.findById(allocation.hostelId);
      if (hostel && hostel.occupiedBeds > 0) {
        await prisma.hostel.update({
          where: { id: allocation.hostelId },
          data: { occupiedBeds: hostel.occupiedBeds - 1 },
        });
      }

      return NextResponse.json({ success: true, allocation: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Hostel allocation action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}