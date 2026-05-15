import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { z } from 'zod';
import { calculateDiscounts } from '@/lib/discounts';

const GenerateBillsSchema = z.object({
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  tierId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = GenerateBillsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { academicYearId, termId, tierId, classId, studentId, branchId, force } = parsed.data;

    const [academicYear, term] = await Promise.all([
      prisma.academicYear.findUnique({ where: { id: academicYearId } }),
      prisma.term.findUnique({ where: { id: termId } }),
    ]);

    if (!academicYear) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    if (!term) return NextResponse.json({ error: 'Term not found' }, { status: 404 });

    const where: any = {
      academicClass: { academicYearId },
      status: 'ACTIVE',
    };
    if (tierId) where.academicClass = { ...where.academicClass, tierId };
    if (classId) where.academicClass = { ...where.academicClass, id: classId };
    if (branchId) where.academicClass = { ...where.academicClass, branchId };
    else if (user.branchId) where.academicClass = { ...where.academicClass, branchId: user.branchId };

    let students;
    if (studentId) {
      students = await prisma.student.findMany({
        where: { id: studentId, tenantId: user.tenantId, enrollments: { some: where } },
        include: {
          enrollments: {
            where,
            include: { academicClass: { include: { tier: true } } },
          },
        },
      });
    } else {
      students = await prisma.student.findMany({
        where: { tenantId: user.tenantId, enrollments: { some: where } },
        include: {
          enrollments: {
            where,
            include: { academicClass: { include: { tier: true } } },
          },
        },
      });
    }

    const results = { generated: 0, skipped: 0, errors: [] as string[] };

    for (const student of students) {
      const enrollment = student.enrollments[0];
      if (!enrollment) { results.skipped++; continue; }

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

      if (existingBill && !force) {
        results.skipped++;
        continue;
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

      let selections: any[] = [];
      if (registration) {
        const sel = await prisma.studentFeeComponentSelection.findMany({
          where: { registrationId: registration.id },
        });
        selections = sel;
      }

      if (!registration || registration.status !== 'CONFIRMED') {
        results.skipped++;
        results.errors.push(`Student ${student.studentId} has not completed fee registration`);
        continue;
      }

      const selectedOptionalIds = new Set(selections.map((s: any) => s.componentId));

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

      const selectedComponents = [...mandatoryComponents, ...selectedOptionals];

      if (selectedComponents.length === 0) {
        results.skipped++;
        results.errors.push(`No fee components found for student ${student.studentId}`);
        continue;
      }

      const componentInfos = selectedComponents.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        category: c.category,
        amount: c.amount,
      }));

      const discountResults = await calculateDiscounts(
        student.id,
        academicYearId,
        user.tenantId,
        componentInfos
      );

      const overrides = await prisma.studentFeeOverride.findMany({
        where: {
          studentId: student.id,
          componentId: { in: selectedComponents.map((c) => c.id) },
        },
      });
      const overrideMap = new Map(overrides.map((o) => [o.componentId, o]));

      const billItems = selectedComponents.map((c) => {
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
          componentId: c.id,
          componentName: c.name,
          componentType: c.type,
          originalAmount,
          amountDue,
          amountPaid: 0,
          outstanding: amountDue,
          discountPercent,
          discountAmount,
          discountInfo,
          status: amountDue === 0 ? 'PAID' as const : 'UNPAID' as const,
          tenantId: user.tenantId,
        };
      });

      const totalAmount = billItems.reduce((sum, item) => sum + item.amountDue, 0);

      if (existingBill && force) {
        await prisma.feeBillItem.deleteMany({ where: { billId: existingBill.id } });
        await prisma.studentFeeBill.delete({ where: { id: existingBill.id } });
      }

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

      if (createdBill && billItems.length > 0) {
        await prisma.feeBillItem.createMany({
          data: billItems.map(item => ({ ...item, billId: createdBill.id })),
        });
      }

      results.generated++;
    }

    return NextResponse.json({
      message: `Bill generation complete`,
      academicYear: academicYear.name,
      term: term.name,
      results,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating bills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');
    const status = searchParams.get('status');

    if (!academicYearId || !termId) {
      return NextResponse.json({ error: 'academicYearId and termId are required' }, { status: 400 });
    }

    const where: any = { academicYearId, termId, tenantId: user.tenantId };
    if (status) where.status = status;

    const bills = await prisma.studentFeeBill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const studentIds = Array.from(new Set(bills.map(b => b.studentId)));
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, studentId: true, firstName: true, lastName: true },
    });
    const studentMap = new Map(students.map(s => [s.id, s]));

    const billIds = bills.map(b => b.id);
    const allBillItems = billIds.length
      ? await prisma.feeBillItem.findMany({ where: { billId: { in: billIds } } })
      : [];
    const itemsByBill = new Map<string, typeof allBillItems>();
    for (const item of allBillItems) {
      if (!itemsByBill.has(item.billId)) itemsByBill.set(item.billId, []);
      itemsByBill.get(item.billId)!.push(item);
    }

    const billsWithStudents = bills.map(b => ({
      ...b,
      student: studentMap.get(b.studentId),
      billItems: itemsByBill.get(b.id) || [],
    }));

    const summary = {
      total: bills.length,
      fullyPaid: bills.filter((b) => b.status === 'FULLY_PAID').length,
      partiallyPaid: bills.filter((b) => b.status === 'PARTIALLY_PAID').length,
      unpaid: bills.filter((b) => b.status === 'UNPAID').length,
      totalBilled: bills.reduce((sum, b) => sum + b.totalAmount, 0),
      totalCollected: bills.reduce((sum, b) => sum + b.amountPaid, 0),
      totalOutstanding: bills.reduce((sum, b) => sum + b.balance, 0),
    };

    return NextResponse.json({ bills: billsWithStudents, summary });
  } catch (error: any) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}