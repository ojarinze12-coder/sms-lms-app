import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { z } from 'zod';

const RecordManualPaymentSchema = z.object({
  studentId: z.string().uuid(),
  billId: z.string().uuid().optional(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'POS', 'ONLINE', 'CARD', 'USSD', 'CHEQUE']),
  paidAt: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    billItemId: z.string().uuid().optional(),
    componentId: z.string().uuid().optional(),
    amount: z.number().positive(),
  })).optional(),
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
    const parsed = RecordManualPaymentSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { studentId, billId, academicYearId, termId, amount, method, paidAt, reference, notes, items } = parsed.data;
    const paymentTime = paidAt ? new Date(paidAt) : new Date();

    const student = await prisma.student.findUnique({ 
      where: { id: studentId },
      select: { id: true, branchId: true, tenantId: true }
    });
    
    if (!student || student.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetBillId = billId;
      let billItems: any[] = [];

      const hasComponentOnlyItems = items?.some(i => i.componentId && !i.billItemId);

      const yearExists = await tx.academicYear.findUnique({ where: { id: academicYearId } });
      if (!yearExists || yearExists.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 });
      }

      const termExists = await tx.term.findUnique({ where: { id: termId } });
      if (!termExists || termExists.academicYearId !== academicYearId) {
        return NextResponse.json({ error: 'Invalid term for the selected academic year' }, { status: 400 });
      }

      if (billId) {
        const bill = await tx.studentFeeBill.findUnique({ where: { id: billId } });
        if (bill) {
          billItems = await tx.feeBillItem.findMany({ where: { billId } });
        }
      } else if (items && items.length > 0 && !hasComponentOnlyItems && items[0].billItemId) {
        const firstItem = await tx.feeBillItem.findUnique({ 
          where: { id: items[0].billItemId }
        });
        if (firstItem) {
          targetBillId = firstItem.billId;
          billItems = await tx.feeBillItem.findMany({ where: { billId: targetBillId } });
        }
      }

      if (hasComponentOnlyItems && !targetBillId) {
        const newBill = await tx.studentFeeBill.create({
          data: {
            studentId,
            academicYearId,
            termId,
            totalAmount: 0,
            amountPaid: 0,
            balance: 0,
            status: 'UNPAID',
            tenantId: user.tenantId,
            branchId: student.branchId,
          }
        });
        targetBillId = newBill.id;
      }

      if (!targetBillId) {
        return NextResponse.json({ error: 'No bill found for this student in the selected term. Please generate bills first or ensure the student has a bill.' }, { status: 400 });
      }

      const receiptNo = generateReceiptNo(user.tenantId);
      
      const receipt = await tx.feeReceipt.create({
        data: {
          receiptNo,
          billId: targetBillId,
          studentId,
          academicYearId,
          termId,
          totalPaid: amount,
          paymentBreakdown: [],
          tenantId: user.tenantId,
          generatedAt: paymentTime,
        },
      });

      const paymentBreakdown: any[] = [];
      let totalAllocated = 0;

      if (items && items.length > 0) {
        let itemMap = new Map(billItems.map(i => [i.id, i]));
        
        for (const paymentItem of items) {
          let billItem = paymentItem.billItemId ? itemMap.get(paymentItem.billItemId) : undefined;
          
          if (!billItem && paymentItem.componentId) {
            const component = await tx.feeComponent.findUnique({ where: { id: paymentItem.componentId } });
            if (component && targetBillId) {
              billItem = await tx.feeBillItem.create({
                data: {
                  billId: targetBillId,
                  componentId: component.id,
                  componentName: component.name,
                  componentType: component.type,
                  originalAmount: component.amount,
                  amountDue: component.amount,
                  amountPaid: 0,
                  outstanding: component.amount,
                  status: 'UNPAID',
                  tenantId: user.tenantId,
                }
              });
              itemMap.set(billItem.id, billItem);
              billItems.push(billItem);
            }
          }
          
          if (!billItem) continue;
          
          const maxApplicable = billItem.outstanding;
          const amountToApply = Math.min(paymentItem.amount, maxApplicable);
          if (amountToApply <= 0) continue;

          totalAllocated += amountToApply;

          const newAmountPaid = billItem.amountPaid + amountToApply;
          const newOutstanding = billItem.amountDue - newAmountPaid;

          await tx.feeBillItem.update({
            where: { id: billItem.id },
            data: {
              amountPaid: newAmountPaid,
              outstanding: Math.max(0, newOutstanding),
              status: newOutstanding <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
            },
          });

          paymentBreakdown.push({
            itemId: billItem.id,
            componentName: billItem.componentName,
            amountPaid: amountToApply,
            outstanding: Math.max(0, newOutstanding),
          });
        }

        await tx.feeReceipt.update({
          where: { id: receipt.id },
          data: { totalPaid: totalAllocated, paymentBreakdown },
        });
      } else {
        await tx.feeReceipt.update({
          where: { id: receipt.id },
          data: { paymentBreakdown: [{ note: 'Unallocated payment', amountPaid: amount }] },
        });
      }

      const payment = await tx.feePayment.create({
        data: {
          amount: amount,
          method,
          status: 'COMPLETED',
          transactionId: reference || undefined,
          studentId,
          feeId: '',
          studentFeeBillId: targetBillId,
          feeReceiptId: receipt.id,
          partialAmounts: items ? Object.fromEntries(items.filter(i => i.billItemId).map(i => [i.billItemId, i.amount])) : {},
          tenantId: user.tenantId,
          branchId: student.branchId,
          paidAt: paymentTime,
          notes,
        },
      });

      if (targetBillId) {
        const updatedItems = await tx.feeBillItem.findMany({ where: { billId: targetBillId } });
        const totalBilled = updatedItems.reduce((sum: number, i: any) => sum + i.amountDue, 0);
        const totalPaid = updatedItems.reduce((sum: number, i: any) => sum + i.amountPaid, 0);
        const totalOutstanding = updatedItems.reduce((sum: number, i: any) => sum + i.outstanding, 0);
        const allPaid = updatedItems.every((i: any) => i.outstanding <= 0);

        await tx.studentFeeBill.update({
          where: { id: targetBillId },
          data: {
            totalAmount: totalBilled,
            amountPaid: totalPaid,
            balance: totalOutstanding,
            status: allPaid ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
          },
        });
      }

      return { receipt, payment };
    });

    return NextResponse.json({
      success: true,
      receiptId: result.receipt.id,
      receiptNo: result.receipt.receiptNo,
      paymentId: result.payment.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording manual payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}