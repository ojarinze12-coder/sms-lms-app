import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { UpdateFeeComponentSchema } from '@/lib/schemas/fee';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const component = await prisma.feeComponent.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });

    if (!component) {
      return NextResponse.json({ error: 'Fee component not found' }, { status: 404 });
    }

    const [tier, branch] = await Promise.all([
      component.tierId ? prisma.tier.findUnique({ where: { id: component.tierId }, select: { id: true, name: true, code: true } }) : null,
      component.branchId ? prisma.branch.findUnique({ where: { id: component.branchId }, select: { id: true, name: true, code: true } }) : null,
    ]);

    return NextResponse.json({ component: { ...component, tier, branch } });
  } catch (error: any) {
    console.error('Error fetching fee component:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.feeComponent.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Fee component not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateFeeComponentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    if (data.type && data.type !== existing.type) {
      const feeType = await prisma.feeType.findFirst({
        where: {
          tenantId: user.tenantId,
          code: data.type,
          isActive: true,
          OR: [{ branchId: existing.branchId }, { branchId: null }],
        },
      });
      if (!feeType) {
        return NextResponse.json({ error: `Invalid fee type: ${data.type}` }, { status: 400 });
      }
    }

    const updated = await prisma.feeComponent.update({
      where: { id: params.id },
      data: {
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      },
    });

    return NextResponse.json({ component: updated });
  } catch (error: any) {
    console.error('Error updating fee component:', error);
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

    const existing = await prisma.feeComponent.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Fee component not found' }, { status: 404 });
    }

    await prisma.feeComponent.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Fee component deleted' });
  } catch (error: any) {
    console.error('Error deleting fee component:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}