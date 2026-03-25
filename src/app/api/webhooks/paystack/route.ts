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
    include: { tenant: true, plan: true },
  });

  if (!invoice) {
    console.error('Subscription invoice not found:', invoiceId);
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
      invoice.tenant.name,
      invoice.invoiceNumber,
      receiptNumber,
      amount,
      invoice.currency,
      new Date().toLocaleDateString('en-NG'),
      billingPeriod,
      invoice.plan.displayName,
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

export async function GET() {
  return NextResponse.json({ status: 'Paystack webhook endpoint' });
}
