import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPaymentReceiptEmail, sendInvoiceCreatedEmail } from '@/lib/email';

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastPayment = await prisma.subscriptionPayment.findFirst({
    orderBy: { createdAt: 'desc' },
    where: { receiptNumber: { startsWith: `RCP-${year}` } },
  });

  let sequence = 1;
  if (lastPayment && lastPayment.receiptNumber) {
    const lastSeq = parseInt(lastPayment.receiptNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `RCP-${year}-${sequence.toString().padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    const event = JSON.parse(body);

    if (signature) {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
        .update(body)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
      case 'transfer.success':
        console.log('Transfer successful:', event.data);
        break;
      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: any) {
  const reference = data.reference;
  const metadata = data.metadata || {};

  console.log(`Processing payment: ${reference}`, { metadata });

  if (reference.startsWith('SUB_')) {
    await handleSubscriptionPayment(data, metadata);
  } else if (reference.startsWith('BILL_')) {
    await handleBillPayment(data, metadata);
  } else if (reference.startsWith('FEE_')) {
    await handleFeePayment(data, metadata);
  } else {
    console.log('Unknown payment reference prefix:', reference);
  }
}

async function handleSubscriptionPayment(data: any, metadata: any) {
  const reference = data.reference;
  const invoiceId = metadata.invoiceId;

  if (!invoiceId) {
    console.error('No invoiceId in metadata for subscription payment:', reference);
    return;
  }

  const existingPayment = await prisma.subscriptionPayment.findFirst({
    where: { referenceNo: reference },
  });

  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: { subscriptionPlan: true, subscription: true },
  });

  if (!invoice) {
    console.error('Subscription invoice not found:', invoiceId);
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: invoice.tenantId },
  });

  if (!tenant) {
    console.error('Tenant not found for invoice:', invoiceId);
    return;
  }

  const tenantAdmin = await prisma.user.findFirst({
    where: { tenantId: invoice.tenantId, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  const amount = data.amount / 100;
  const receiptNumber = await generateReceiptNumber();

  if (!existingPayment) {
    const newPayment = await prisma.subscriptionPayment.create({
      data: {
        invoiceId: invoice.id,
        amount: amount,
        currency: data.currency || 'NGN',
        status: 'COMPLETED',
        method: 'ONLINE',
        referenceNo: reference,
        transactionId: data.id?.toString(),
        paymentGateway: 'PAYSTACK',
        gatewayResponse: data,
        paidAt: new Date(),
        receiptNumber,
      },
    });

    await prisma.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SYSTEM',
        actorEmail: 'system@pccedu.com',
        action: 'SUBSCRIPTION_PAYMENT_RECEIVED',
        actionType: 'CREATE',
        category: 'BILLING',
        targetType: 'invoice',
        targetId: invoice.id,
        targetName: invoice.invoiceNumber,
        description: `Payment received for invoice ${invoice.invoiceNumber} via Paystack`,
        metadata: {
          paymentId: newPayment.id,
          amount: amount,
          reference,
        },
      },
    });

    console.log(`Subscription payment ${reference} completed successfully for invoice ${invoice.invoiceNumber}`);
  } else {
    await prisma.subscriptionPayment.update({
      where: { id: existingPayment.id },
      data: {
        status: 'COMPLETED',
        transactionId: data.id?.toString(),
        gatewayResponse: data,
        paidAt: new Date(),
        receiptNumber,
      },
    });

    await prisma.subscriptionInvoice.update({
      where: { id: existingPayment.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    console.log(`Subscription payment ${reference} updated to completed`);
  }

  if (tenantAdmin?.email) {
    const billingPeriod = `${new Date(invoice.billingPeriodStart).toLocaleDateString('en-NG')} - ${new Date(invoice.billingPeriodEnd).toLocaleDateString('en-NG')}`;
    
    await sendPaymentReceiptEmail(
      tenantAdmin.email,
      tenant.name,
      invoice.invoiceNumber,
      receiptNumber,
      amount,
      invoice.currency,
      new Date().toLocaleDateString('en-NG'),
      billingPeriod,
      invoice.subscriptionPlan.displayName,
      'Online',
      'Paystack'
    );
  }
}

async function handleFeePayment(data: any, metadata: any) {
  const reference = data.reference;

  const payment = await prisma.feePayment.findFirst({
    where: { referenceNo: reference },
  });

  if (!payment) {
    console.error('Fee payment not found for reference:', reference);
    return;
  }

  await prisma.feePayment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      transactionId: data.id?.toString(),
      gatewayResponse: data,
      paidAt: new Date(),
    },
  });

  console.log(`Fee payment ${reference} completed successfully`);
}

async function handleBillPayment(data: any, metadata: any) {
  const reference = data.reference;
  const billId = metadata.billId;
  const amount = data.amount / 100;

  console.log(`Processing bill payment: ${reference}, amount: ${amount}, billId: ${billId}`);

  const payment = await prisma.feePayment.findFirst({
    where: { referenceNo: reference },
  });

  if (!payment) {
    console.error('Fee payment not found for reference:', reference);
    return;
  }

  if (!billId) {
    console.error('No billId in metadata for bill payment:', reference);
    return;
  }

  const bill = await prisma.studentFeeBill.findUnique({
    where: { id: billId },
    include: { items: true },
  });

  if (!bill) {
    console.error('Student bill not found:', billId);
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: bill.tenantId },
  });

  const student = await prisma.student.findUnique({
    where: { id: bill.studentId },
    select: { firstName: true, lastName: true, studentId: true },
  });

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: bill.academicYearId },
  });

  const term = await prisma.term.findUnique({
    where: { id: bill.termId },
  });

  const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.feeReceipt.create({
      data: {
        receiptNo,
        billId: bill.id,
        studentId: bill.studentId,
        academicYearId: bill.academicYearId,
        termId: bill.termId,
        totalPaid: amount,
        paymentBreakdown: [],
        tenantId: bill.tenantId,
        generatedAt: new Date(),
      },
    });

    const paymentBreakdown: any[] = [];
    let remainingAmount = amount;

    for (const item of bill.items) {
      if (remainingAmount <= 0) break;

      const maxApplicable = item.outstanding;
      if (maxApplicable <= 0) continue;

      const amountToApply = Math.min(remainingAmount, maxApplicable);
      if (amountToApply <= 0) continue;

      const newAmountPaid = item.amountPaid + amountToApply;
      const newOutstanding = Math.max(0, item.amountDue - newAmountPaid);

      await tx.feeBillItem.update({
        where: { id: item.id },
        data: {
          amountPaid: newAmountPaid,
          outstanding: newOutstanding,
          status: newOutstanding <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        },
      });

      paymentBreakdown.push({
        itemId: item.id,
        componentName: item.componentName,
        amountPaid: amountToApply,
        outstanding: newOutstanding,
      });

      remainingAmount -= amountToApply;
    }

    await tx.feeReceipt.update({
      where: { id: receipt.id },
      data: { paymentBreakdown },
    });

    const updatedItems = await tx.feeBillItem.findMany({ where: { billId: bill.id } });
    const totalAmountPaid = updatedItems.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalOutstanding = updatedItems.reduce((sum, i) => sum + i.outstanding, 0);
    const allPaid = updatedItems.every(i => i.outstanding <= 0);

    await tx.studentFeeBill.update({
      where: { id: bill.id },
      data: {
        amountPaid: totalAmountPaid,
        balance: totalOutstanding,
        status: allPaid ? 'FULLY_PAID' : totalAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      },
    });

    await tx.feePayment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        transactionId: data.id?.toString(),
        gatewayResponse: data,
        paidAt: new Date(),
        studentFeeBillId: bill.id,
        feeReceiptId: receipt.id,
        partialAmounts: bill.items.reduce((acc: any, item) => {
          const paymentItem = paymentBreakdown.find(p => p.itemId === item.id);
          if (paymentItem) {
            acc[item.id] = paymentItem.amountPaid;
          }
          return acc;
        }, {}),
      },
    });

    return { receipt, paymentBreakdown };
  });

  console.log(`Bill payment ${reference} completed successfully. Receipt: ${receiptNo}`);

  if (student && tenant) {
    console.log(`Payment for ${student.firstName} ${student.lastName} (${student.studentId}) - Amount: ${amount}, Bill: ${bill.id}`);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Paystack webhook endpoint' });
}
