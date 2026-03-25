import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  model: z.string().optional(),
  capacity: z.number().default(50),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  status: z.string().default('ACTIVE'),
  routeId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicles = await prisma.transportVehicle.findMany({
      include: {
        route: true,
      },
      orderBy: { vehicleNo: 'asc' },
    });

    const mappedVehicles = vehicles.map(v => ({
      ...v,
      plateNumber: v.vehicleNo,
    }));

    return NextResponse.json(mappedVehicles || []);
  } catch (error) {
    console.error('Vehicles GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createVehicleSchema.parse(body);

    const vehicle = await prisma.transportVehicle.create({
      data: {
        vehicleNo: validatedData.plateNumber,
        model: validatedData.model,
        capacity: validatedData.capacity,
        driverName: validatedData.driverName,
        driverPhone: validatedData.driverPhone,
        routeId: validatedData.routeId,
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Vehicle POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
