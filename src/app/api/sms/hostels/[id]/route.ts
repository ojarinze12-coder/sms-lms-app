import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateHostelSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  wardenName: z.string().optional(),
  wardenPhone: z.string().optional(),
  totalBeds: z.number().optional(),
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

    const hostel = await prisma.hostel.findFirst({
      where: { id, tenantId },
      include: {
        rooms: {
          include: {
            beds: true,
          },
          orderBy: { roomNo: 'asc' },
        },
        allocations: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            room: true,
            bed: true,
          },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    return NextResponse.json(hostel);
  } catch (error) {
    console.error('Hostel GET error:', error);
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

    const existing = await prisma.hostel.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateHostelSchema.parse(body);

    const hostel = await prisma.hostel.update({
      where: { id },
      data,
    });

    return NextResponse.json(hostel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel PUT error:', error);
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

    const existing = await prisma.hostel.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    await prisma.hostel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hostel DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}