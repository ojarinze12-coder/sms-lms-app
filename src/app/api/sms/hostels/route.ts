import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const hostelSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional().default('MALE'),
  description: z.string().optional(),
  address: z.string().optional(),
  wardenName: z.string().optional(),
  wardenPhone: z.string().optional(),
  totalBeds: z.number().optional().default(0),
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = { tenantId };
    if (status) where.status = status;
    if (type) where.type = type;

    const hostels = await prisma.hostel.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        _count: {
          select: { allocations: true },
        },
      },
    });

    return NextResponse.json(hostels);
  } catch (error) {
    console.error('Hostel GET error:', error);
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
    const data = hostelSchema.parse(body);

    const hostel = await prisma.hostel.create({
      data: {
        ...data,
        tenantId,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(hostel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}