import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  studentId: z.string().uuid(),
  routeId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
  amount: z.number(),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const where: any = { tenantId };
    if (status) where.paymentStatus = status;
    if (studentId) where.studentId = studentId;

    const subscriptions = await prisma.transportSubscription.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        route: { select: { id: true, name: true, fee: true } },
        vehicle: { select: { id: true, vehicleNo: true, model: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Transport subscriptions GET error:', error);
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

    const tenantId = authUser.tenantId;
    const body = await request.json();
    const data = subscriptionSchema.parse(body);

    const subscription = await prisma.transportSubscription.create({
      data: {
        studentId: data.studentId,
        routeId: data.routeId,
        vehicleId: data.vehicleId,
        academicYearId: data.academicYearId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef,
        paymentStatus: data.transactionRef ? 'PAID' : 'PENDING',
        paidAt: data.transactionRef ? new Date() : undefined,
        tenantId,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        route: { select: { name: true } },
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Transport subscription POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}