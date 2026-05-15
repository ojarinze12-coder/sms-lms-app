import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { calculateDiscounts } from '@/lib/discounts';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    if (!academicYearId || !termId) {
      return NextResponse.json({ error: 'academicYearId and termId are required' }, { status: 400 });
    }

    const bill = await prisma.studentFeeBill.findUnique({
      where: {
        studentId_academicYearId_termId: {
          studentId: params.studentId,
          academicYearId,
          termId,
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const [student, academicYear, term] = await Promise.all([
      prisma.student.findUnique({
        where: { id: params.studentId },
        select: { id: true, studentId: true, firstName: true, lastName: true, branchId: true },
      }),
      prisma.academicYear.findUnique({
        where: { id: academicYearId },
        select: { id: true, name: true },
      }),
      prisma.term.findUnique({
        where: { id: termId },
        select: { id: true, name: true },
      }),
    ]);

    const billItems = await prisma.feeBillItem.findMany({
      where: { billId: bill.id },
      orderBy: { componentName: 'asc' },
    });

    const receipts = await prisma.feeReceipt.findMany({
      where: { billId: bill.id },
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json({
      bill: { ...bill, student, academicYear, term, billItems, receipts },
    });
  } catch (error: any) {
    console.error('Error fetching student bill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { academicYearId, termId } = body;

    if (!academicYearId || !termId) {
      return NextResponse.json({ error: 'academicYearId and termId are required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.studentId, tenantId: user.tenantId },
      include: {
        enrollments: {
          where: { academicClass: { academicYearId } },
          include: { academicClass: { include: { tier: true } } },
        },
      },
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (!student.enrollments.length) return NextResponse.json({ error: 'Student not enrolled for this academic year' }, { status: 404 });

    const enrollment = student.enrollments[0];
    const tierId = enrollment.academicClass.tierId;
    const studentBranchId = student.branchId || null;

    const existingBill = await prisma.studentFeeBill.findUnique({
      where: {
        studentId_academicYearId_termId: {
          studentId: student.id,
          academicYearId,
          termId,
        },
      },
    });

    if (existingBill) {
      return NextResponse.json({ error: 'Bill already exists. Use force=true to regenerate.', bill: existingBill }, { status: 409 });
    }

    const registration = await prisma.studentFeeRegistration.findUnique({
      where: {
        studentId_academicYearId_termId: {
          studentId: student.id,
          academicYearId,
          termId,
        },
      },
    });

    if (!registration || registration.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Student has not completed fee registration for this term' }, { status: 400 });
    }

    const selections = await prisma.studentFeeComponentSelection.findMany({
      where: { registrationId: registration.id },
    });
    const selectedOptionalIds = new Set(selections.map((s) => s.componentId));

    const componentWhere: any = {
      academicYearId,
      tenantId: user.tenantId,
      category: 'MANDATORY',
      OR: [
        { tierId: tierId },
        { tierId: null },
        { branchId: studentBranchId },
        { branchId: null },
      ],
    };

    const mandatoryComponents = await prisma.feeComponent.findMany({ where: componentWhere });

    const optionalWhere = {
      ...componentWhere,
      category: 'OPTIONAL' as const,
      id: { in: Array.from(selectedOptionalIds) },
    };
    const selectedOptionals = await prisma.feeComponent.findMany({ where: optionalWhere });

    const allComponents = [...mandatoryComponents, ...selectedOptionals];

    const componentInfos = allComponents.map((c) => ({
      id: c.id, name: c.name, type: c.type, category: c.category, amount: c.amount,
    }));

    const discountResults = await calculateDiscounts(student.id, academicYearId, user.tenantId, componentInfos);

    const overrides = await prisma.studentFeeOverride.findMany({
      where: {
        studentId: student.id,
        componentId: { in: allComponents.map((c) => c.id) },
      },
    });
    const overrideMap = new Map(overrides.map((o) => [o.componentId, o]));

    const billItems = allComponents.map((c) => {
      const override = overrideMap.get(c.id);
      let baseAmount = c.amount;
      if (override?.isWaived) baseAmount = 0;
      else if (override?.customAmount !== null) baseAmount = override!.customAmount || c.amount;
      const discount = discountResults.get(c.id);
      const originalAmount = c.amount;
      let amountDue = baseAmount;
      let discountPercent = 0;
      let discountAmount = 0;
      let discountInfo: any[] = [];
      if (discount && baseAmount > 0 && discount.finalAmount < baseAmount) {
        amountDue = discount.finalAmount;
        discountPercent = discount.totalDiscountPercent;
        discountAmount = discount.discountAmount;
        discountInfo = discount.appliedDiscounts;
      }
      return {
        componentId: c.id, componentName: c.name, componentType: c.type, originalAmount,
        amountDue, amountPaid: 0, outstanding: amountDue,
        discountPercent, discountAmount, discountInfo,
        status: amountDue === 0 ? 'PAID' as const : 'UNPAID' as const, tenantId: user.tenantId,
      };
    });

    const totalAmount = billItems.reduce((sum, item) => sum + item.amountDue, 0);

    const createdBill = await prisma.studentFeeBill.create({
      data: {
        studentId: student.id,
        academicYearId,
        termId,
        status: totalAmount === 0 ? 'FULLY_PAID' : 'UNPAID',
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        tenantId: user.tenantId,
        branchId: studentBranchId,
      },
    });

    if (billItems.length > 0) {
      await prisma.feeBillItem.createMany({
        data: billItems.map(item => ({ ...item, billId: createdBill.id })),
      });
    }

    const [fetchedStudent, fetchedYear, fetchedTerm] = await Promise.all([
      prisma.student.findUnique({ where: { id: student.id }, select: { id: true, studentId: true, firstName: true, lastName: true, branchId: true } }),
      prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { id: true, name: true } }),
      prisma.term.findUnique({ where: { id: termId }, select: { id: true, name: true } }),
    ]);

    return NextResponse.json({
      bill: { ...createdBill, student: fetchedStudent, academicYear: fetchedYear, term: fetchedTerm, billItems },
      message: 'Bill generated successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating student bill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}