import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const subscription = await prisma.transportSubscription.findFirst({
      where: { id, tenantId: authUser.tenantId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const updated = await prisma.transportSubscription.update({
      where: { id },
      data: {
        paymentStatus: body.paymentStatus,
        paymentMethod: body.paymentMethod,
        transactionRef: body.transactionRef,
        paidAt: body.paymentStatus === 'PAID' && !subscription.paidAt ? new Date() : undefined,
        isActive: body.isActive,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        route: { select: { name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Transport subscription PUT error:', error);
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

    const { id } = await params;

    const subscription = await prisma.transportSubscription.findFirst({
      where: { id, tenantId: authUser.tenantId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await prisma.transportSubscription.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transport subscription DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}