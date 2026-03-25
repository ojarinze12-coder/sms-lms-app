import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, gateway = 'PAYSTACK' } = body;

    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    if (action === 'initialize') {
      return initializePayment(invoice, gateway, authUser);
    }

    if (action === 'record') {
      return recordPayment(invoice, body, authUser);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Invoice Payment POST error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

async function initializePayment(invoice: any, gateway: string, authUser: any) {
  const tenantAdmins = await prisma.user.findFirst({
    where: { tenantId: invoice.tenantId, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  const email = tenantAdmins?.email || 'admin@school.com';
  
  const referenceNo = `SUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const metadata = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    tenantId: invoice.tenantId,
    tenantName: invoice.tenant.name,
    planName: invoice.plan.displayName,
    billingCycle: invoice.billingCycle,
  };

  let paymentLink: string;
  let paymentGateway = gateway;

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!paystackKey && gateway === 'PAYSTACK') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${invoice.amount}`;
    paymentGateway = 'DEMO';
  } else if (gateway === 'PAYSTACK') {
    const response = await paystack.initializePayment({
      email,
      amount: formatAmountToKobo(invoice.amount),
      currency: invoice.currency || 'NGN',
      reference: referenceNo,
      metadata,
    });

    if (!response.status) {
      return NextResponse.json({ error: response.message }, { status: 400 });
    }

    paymentLink = response.data.authorization_url;
  } else if (gateway === 'FLUTTERWAVE') {
    if (!flutterwaveKey) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${invoice.amount}`;
      paymentGateway = 'DEMO';
    } else {
      const response = await flutterwave.initializePayment({
        email,
        name: invoice.tenant.name,
        amount: invoice.amount,
        currency: invoice.currency || 'NGN',
        txRef: referenceNo,
        meta: metadata,
      });

      if (response.status !== 'success') {
        return NextResponse.json({ error: response.message }, { status: 400 });
      }

      paymentLink = response.data.link;
    }
  } else {
    return NextResponse.json({ error: 'Unsupported gateway' }, { status: 400 });
  }

  const payment = await prisma.subscriptionPayment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency || 'NGN',
      status: 'PENDING',
      method: 'ONLINE',
      referenceNo,
      paymentGateway,
    },
  });

  return NextResponse.json({
    paymentLink,
    reference: referenceNo,
    paymentId: payment.id,
  });
}

async function recordPayment(invoice: any, body: any, authUser: any) {
  const { amount, method, transactionId, gatewayResponse, status, referenceNo } = body;

  const payment = await prisma.subscriptionPayment.create({
    data: {
      invoiceId: invoice.id,
      amount: parseFloat(amount) || invoice.amount,
      currency: invoice.currency || 'NGN',
      status: status || 'COMPLETED',
      method: method || 'ONLINE',
      referenceNo,
      transactionId,
      gatewayResponse,
      paidAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  if (status === 'COMPLETED') {
    await prisma.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'INVOICE_PAID',
        actionType: 'UPDATE',
        category: 'BILLING',
        targetType: 'invoice',
        targetId: invoice.id,
        targetName: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber} marked as paid`,
        metadata: { paymentId: payment.id, amount: parseFloat(amount) },
      },
    });
  }

  return NextResponse.json({ payment }, { status: 201 });
}
