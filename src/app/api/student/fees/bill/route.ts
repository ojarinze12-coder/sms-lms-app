import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { userId: user.id },
          ...(user.role === 'PARENT'
            ? [{ parents: { some: { userId: user.id } } }]
            : []),
        ],
      },
      include: {
        enrollments: {
          where: { academicClass: { academicYearId } },
          include: { academicClass: { include: { tier: true, academicYear: true } } },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled for this academic year' }, { status: 404 });
    }

    const academicYear = enrollment.academicClass.academicYear;
    const tier = enrollment.academicClass.tier;

    const bill = await prisma.studentFeeBill.findUnique({
      where: {
        studentId_academicYearId_termId: {
          studentId: student.id,
          academicYearId,
          termId: termId || '',
        },
      },
    });

    if (!bill) {
      return NextResponse.json({
        exists: false,
        student: {
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          class: enrollment.academicClass.name,
          tier: tier?.name,
        },
        academicYear: { id: academicYear.id, name: academicYear.name },
        termId,
        message: termId
          ? 'Bill has not been generated for this term yet.'
          : 'Please specify a termId.',
        bill: null,
      });
    }

    const billItems = await prisma.feeBillItem.findMany({
      where: { billId: bill.id },
      orderBy: { componentName: 'asc' },
    });

    const receipts = await prisma.feeReceipt.findMany({
      where: { billId: bill.id },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        receiptNo: true,
        totalPaid: true,
        generatedAt: true,
        receiptUrl: true,
      },
    });

    return NextResponse.json({
      exists: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        class: enrollment.academicClass.name,
        tier: tier?.name,
      },
      academicYear: { id: academicYear.id, name: academicYear.name },
      bill: {
        id: bill.id,
        status: bill.status,
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        generatedAt: bill.generatedAt,
        items: billItems.map((item) => ({
          id: item.id,
          componentId: item.componentId,
          componentName: item.componentName,
          componentType: item.componentType,
          amountDue: item.amountDue,
          amountPaid: item.amountPaid,
          outstanding: item.outstanding,
          status: item.status,
        })),
        receipts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching student bill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}