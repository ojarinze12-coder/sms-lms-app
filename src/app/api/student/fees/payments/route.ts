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
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const where: any = { studentId: student.id };
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        feeReceipt: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    const billIds = payments.filter(p => p.studentFeeBillId).map(p => p.studentFeeBillId!);
    const bills = billIds.length > 0 ? await prisma.studentFeeBill.findMany({
      where: { id: { in: billIds } },
      include: {
        academicYear: { select: { name: true } },
        term: { select: { name: true } },
      },
    }) : [];
    const billMap = new Map(bills.map(b => [b.id, b]));

    const formattedPayments = payments.map(p => {
      const bill = p.studentFeeBillId ? billMap.get(p.studentFeeBillId) : null;
      return {
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
        transactionId: p.transactionId,
        academicYear: bill?.academicYear?.name,
        term: bill?.term?.name,
        receiptNo: p.feeReceipt?.receiptNo,
      };
    });

    return NextResponse.json({ payments: formattedPayments });
  } catch (error: any) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}