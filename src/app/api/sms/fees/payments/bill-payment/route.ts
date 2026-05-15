import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { z } from 'zod';

const RecordBillPaymentSchema = z.object({
  billId: z.string().uuid(),
  items: z.array(z.object({
    billItemId: z.string().uuid(),
    amount: z.number().positive(),
  })).min(1),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'USSD', 'CHEQUE', 'WAIVER', 'POS']),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

function generateReceiptNo(tenantId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'record-bill-payment') {
      return recordBillPayment(user, body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function recordBillPayment(user: any, body: any) {
  const parsed = RecordBillPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { billId, items, method, transactionId, paidAt, notes } = parsed.data;

  const bill = await prisma.studentFeeBill.findUnique({ where: { id: billId } });
  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }

  const billItems = await prisma.feeBillItem.findMany({ where: { billId } });
  const itemMap = new Map<string, any>();
  for (const item of billItems) {
    itemMap.set(item.id, item);
  }

  const [student, academicYear, term] = await Promise.all([
    prisma.student.findUnique({ where: { id: bill.studentId }, select: { id: true, branchId: true } }),
    prisma.academicYear.findUnique({ where: { id: bill.academicYearId }, select: { id: true, name: true } }),
    prisma.term.findUnique({ where: { id: bill.termId }, select: { id: true, name: true } }),
  ]);

  for (const paymentItem of items) {
    if (!itemMap.has(paymentItem.billItemId)) {
      return NextResponse.json({ error: `Bill item ${paymentItem.billItemId} not found` }, { status: 400 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const receiptNo = generateReceiptNo(user.tenantId);
    const paymentTime = paidAt ? new Date(paidAt) : new Date();

    const receipt = await tx.feeReceipt.create({
      data: {
        receiptNo,
        billId,
        studentId: student!.id,
        academicYearId: academicYear!.id,
        termId: term!.id,
        totalPaid: 0,
        paymentBreakdown: [],
        tenantId: user.tenantId,
        generatedAt: paymentTime,
      },
    });

    const partialAmounts: Record<string, number> = {};
    let totalPaidThisTx = 0;
    const paymentBreakdown: any[] = [];

    for (const paymentItem of items) {
      const billItem = itemMap.get(paymentItem.billItemId);
      if (!billItem) continue;
      const maxApplicable = billItem.outstanding;
      const amountToApply = Math.min(paymentItem.amount, maxApplicable);
      if (amountToApply <= 0) continue;

      partialAmounts[paymentItem.billItemId] = amountToApply;
      totalPaidThisTx += amountToApply;

      const newAmountPaid = billItem.amountPaid + amountToApply;
      const newOutstanding = billItem.amountDue - newAmountPaid;

      await tx.feeBillItem.update({
        where: { id: paymentItem.billItemId },
        data: {
          amountPaid: newAmountPaid,
          outstanding: Math.max(0, newOutstanding),
          status: newOutstanding <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        },
      });

      paymentBreakdown.push({
        itemId: paymentItem.billItemId,
        componentName: billItem.componentName,
        amountPaid: amountToApply,
        outstanding: Math.max(0, newOutstanding),
      });
    }

    await tx.feeReceipt.update({
      where: { id: receipt.id },
      data: { totalPaid: totalPaidThisTx, paymentBreakdown },
    });

    const payment = await tx.feePayment.create({
      data: {
        amount: totalPaidThisTx,
        method,
        status: 'COMPLETED',
        transactionId,
        studentId: student!.id,
        feeId: '',
        studentFeeBillId: billId,
        feeReceiptId: receipt.id,
        partialAmounts,
        tenantId: user.tenantId,
        branchId: student!.branchId,
        paidAt: paymentTime,
        notes,
      },
    });

    const updatedBill = await tx.studentFeeBill.findUnique({ where: { id: billId } });
    const updatedItems = await tx.feeBillItem.findMany({ where: { billId } });
    const allPaid = updatedItems.every((i: any) => i.outstanding <= 0);
    await tx.studentFeeBill.update({
      where: { id: billId },
      data: {
        amountPaid: updatedItems.reduce((sum: number, i: any) => sum + i.amountPaid, 0),
        balance: updatedItems.reduce((sum: number, i: any) => sum + i.outstanding, 0),
        status: allPaid ? 'FULLY_PAID' : (updatedBill?.amountPaid || 0) > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      },
    });

    return { receipt, payment, paymentBreakdown, totalPaidThisTx };
  });

  return NextResponse.json({
    message: 'Payment recorded successfully',
    receipt: {
      id: result.receipt.id,
      receiptNo: result.receipt.receiptNo,
      totalPaid: result.receipt.totalPaid,
      generatedAt: result.receipt.generatedAt,
      paymentBreakdown: result.paymentBreakdown,
    },
    paymentId: result.payment.id,
  }, { status: 201 });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const billId = searchParams.get('billId');

    if (!studentId && !billId) {
      return NextResponse.json({ error: 'studentId or billId is required' }, { status: 400 });
    }

    const where: any = { tenantId: user.tenantId };
    if (studentId) where.studentId = studentId;
    if (billId) where.studentFeeBillId = billId;

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}