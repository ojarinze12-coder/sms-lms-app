import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { CreateDiscountTypeSchema } from '@/lib/schemas/fee';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = { tenantId: user.tenantId };
    if (isActive === 'true') where.isActive = true;

    const types = await prisma.discountType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ discountTypes: types });
  } catch (error: any) {
    console.error('Error fetching discount types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateDiscountTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await prisma.discountType.findUnique({
      where: { tenantId_code: { tenantId: user.tenantId, code: data.code } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Discount type with this code already exists' }, { status: 409 });
    }

    const type = await prisma.discountType.create({
      data: {
        name: data.name,
        code: data.code,
        discountPercentage: data.discountPercentage,
        description: data.description,
        maxDiscountPerStudent: data.maxDiscountPerStudent,
        requiresApproval: data.requiresApproval,
        appliesTo: data.appliesTo,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json({ discountType: type }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating discount type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}