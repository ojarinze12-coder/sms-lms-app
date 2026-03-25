import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  area: z.string().optional(),
  description: z.string().optional(),
  fare: z.number().optional(),
  pickupPoints: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routes = await prisma.transportRoute.findMany({
      include: {
        stops: { orderBy: { order: 'asc' } },
        vehicles: true,
      },
      orderBy: { name: 'asc' },
    });

    const mappedRoutes = routes.map(r => ({
      ...r,
      area: r.description,
      fare: r.fee,
      pickupPoints: r.stops.map(s => s.name),
    }));

    return NextResponse.json(mappedRoutes || []);
  } catch (error) {
    console.error('Routes GET error:', error);
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
    const validatedData = createRouteSchema.parse(body);

    const route = await prisma.transportRoute.create({
      data: {
        name: validatedData.name,
        description: validatedData.area || validatedData.description,
        fee: validatedData.fare,
        tenantId: authUser.tenantId,
      },
    });

    if (validatedData.pickupPoints && validatedData.pickupPoints.length > 0) {
      await prisma.transportStop.createMany({
        data: validatedData.pickupPoints.map((point, index) => ({
          name: point,
          order: index,
          routeId: route.id,
          tenantId: authUser.tenantId,
        })),
      });
    }

    const routeWithStops = await prisma.transportRoute.findUnique({
      where: { id: route.id },
      include: {
        stops: { orderBy: { order: 'asc' } },
        vehicles: true,
      },
    });

    return NextResponse.json(routeWithStops, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Route POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
