import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const classId = searchParams.get('classId');
    const type = searchParams.get('type');
    const branchId = searchParams.get('branchId');
    const tierId = searchParams.get('tierId');

    const where: any = { tenantId: user.tenantId };
    
    if (academicYearId) where.academicYearId = academicYearId;
    if (type) where.type = type;
    if (branchId) where.branchId = branchId;
    if (tierId) where.tierId = tierId;

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        academicYear: true,
        term: true,
        branch: {
          select: { id: true, name: true, code: true }
        },
        tier: {
          select: { id: true, name: true, code: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ feeStructures });
  } catch (error: any) {
    console.error('Error fetching fee structures:', error);
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
    const {
      name,
      description,
      amount,
      type,
      category,
      isRecurring,
      installments,
      dueDate,
      academicYearId,
      termId,
      branchId,
      tierId,
    } = body;

    if (!name || !amount || !academicYearId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, amount, academicYearId, type' },
        { status: 400 }
      );
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        type,
        category: category || 'MANDATORY',
        isRecurring: isRecurring || false,
        installments: installments || 1,
        dueDate: dueDate ? new Date(dueDate) : null,
        academicYearId,
        termId: termId || null,
        branchId: branchId || null,
        tierId: tierId || null,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json({ feeStructure }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
