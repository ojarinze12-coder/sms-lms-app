import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { UpdateDiscountTypeSchema } from '@/lib/schemas/fee';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const type = await prisma.discountType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!type) return NextResponse.json({ error: 'Discount type not found' }, { status: 404 });

    return NextResponse.json({ discountType: type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.discountType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Discount type not found' }, { status: 404 });

    const body = await request.json();
    const parsed = UpdateDiscountTypeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const type = await prisma.discountType.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ discountType: type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.discountType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Discount type not found' }, { status: 404 });

    const inUse = await prisma.studentDiscount.findFirst({
      where: { discountTypeId: params.id },
    });
    if (inUse) {
      await prisma.discountType.update({
        where: { id: params.id },
        data: { isActive: false },
      });
    } else {
      await prisma.discountType.delete({ where: { id: params.id } });
    }

    return NextResponse.json({ message: 'Discount type deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}