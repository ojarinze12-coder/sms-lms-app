import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const type = await prisma.feeType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!type) return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });

    return NextResponse.json({ feeType: type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const UpdateFeeTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).toUpperCase().optional(),
  isActive: z.boolean().optional(),
  branchId: z.string().uuid('Invalid branch ID').nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.feeType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });

    const body = await request.json();
    const parsed = UpdateFeeTypeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    if (parsed.data.code && parsed.data.code !== existing.code) {
      const duplicate = await prisma.feeType.findFirst({
        where: {
          tenantId: user.tenantId,
          code: parsed.data.code,
          id: { not: params.id },
          ...(parsed.data.branchId ? { branchId: parsed.data.branchId } : { branchId: null }),
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Fee type with this code already exists' }, { status: 409 });
      }
    }

    const feeType = await prisma.feeType.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ feeType });
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
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.feeType.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });

    const inUse = await prisma.feeComponent.findFirst({
      where: { type: existing.code, tenantId: user.tenantId },
    });
    if (inUse) {
      await prisma.feeType.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: 'Fee type deactivated (in use)' });
    }

    await prisma.feeType.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Fee type deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}