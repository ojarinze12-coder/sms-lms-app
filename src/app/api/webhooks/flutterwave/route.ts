import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPaymentReceiptEmail } from '@/lib/email';

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
    const signature = request.headers.get('verif-hash');

    const flutterwaveSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (flutterwaveSecret) {
      const hash = crypto.createHmac('sha256', flutterwaveSecret).update(body).digest('hex');
      if (signature !== hash) {
        console.error('Flutterwave webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'charge.completed':
        await handleSuccessfulPayment(event.data);
        break;
      case 'transfer.completed':
        console.log('Transfer completed:', event.data);
        break;
      default:
        console.log('Unhandled Flutterwave event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: any) {
  const txRef = data.tx_ref;
  const metadata = data.meta || {};

  console.log(`Processing Flutterwave payment: ${txRef}`, { metadata });

  if (txRef.startsWith('SUB_')) {
    await handleSubscriptionPayment(data, metadata);
  } else if (txRef.startsWith('FEE_')) {
    await handleFeePayment(data, metadata);
  } else {
    console.log('Unknown payment reference prefix:', txRef);
  }
}

async function handleSubscriptionPayment(data: any, metadata: any) {
  const txRef = data.tx_ref;
  const invoiceId = metadata.invoiceId;

  if (!invoiceId) {
    console.error('No invoiceId in metadata for subscription payment:', txRef);
    return;
  }

  const existingPayment = await prisma.subscriptionPayment.findFirst({
    where: { referenceNo: txRef },
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

  const amount = data.amount || 0;
  const receiptNumber = await generateReceiptNumber();

  if (!existingPayment) {
    const newPayment = await prisma.subscriptionPayment.create({
      data: {
        invoiceId: invoice.id,
        amount: amount,
        currency: data.currency || 'NGN',
        status: 'COMPLETED',
        method: 'ONLINE',
        referenceNo: txRef,
        transactionId: data.id?.toString(),
        paymentGateway: 'FLUTTERWAVE',
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
        actorEmail: 'system@flutterwave.com',
        action: 'SUBSCRIPTION_PAYMENT_RECEIVED',
        actionType: 'CREATE',
        category: 'BILLING',
        targetType: 'invoice',
        targetId: invoice.id,
        targetName: invoice.invoiceNumber,
        description: `Payment received for invoice ${invoice.invoiceNumber} via Flutterwave`,
        metadata: {
          paymentId: newPayment.id,
          amount: amount,
          reference: txRef,
        },
      },
    });

    console.log(`Flutterwave subscription payment ${txRef} completed successfully for invoice ${invoice.invoiceNumber}`);
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

    console.log(`Flutterwave subscription payment ${txRef} updated to completed`);
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
      'Flutterwave'
    );
  }
}

async function handleFeePayment(data: any, metadata: any) {
  const txRef = data.tx_ref;

  const payment = await prisma.feePayment.findFirst({
    where: { referenceNo: txRef },
  });

  if (!payment) {
    console.error('Fee payment not found for tx_ref:', txRef);
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

  console.log(`Flutterwave fee payment ${txRef} completed successfully`);
}

export async function GET() {
  return NextResponse.json({ status: 'Flutterwave webhook endpoint' });
}
