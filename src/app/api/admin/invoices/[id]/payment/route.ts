import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';
import { decrypt } from '@/lib/security';

async function getPlatformPaymentConfig() {
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: 'platform' },
  });

  if (!platformSettings) {
    return {
      useEnvVars: true,
      paymentGatewayEnabled: false,
      paymentGateway: process.env.DEFAULT_PAYMENT_GATEWAY || 'PAYSTACK',
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
      flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      demoMode: false,
    };
  }

  let paystackKey = platformSettings.paystackSecretKey;
  let flutterwaveKey = platformSettings.flutterwaveSecretKey;

  if (paystackKey) {
    try { paystackKey = decrypt(paystackKey); } catch (e) { paystackKey = null; }
  }
  if (flutterwaveKey) {
    try { flutterwaveKey = decrypt(flutterwaveKey); } catch (e) { flutterwaveKey = null; }
  }

  return {
    useEnvVars: false,
    paymentGatewayEnabled: platformSettings.paymentGatewayEnabled || false,
    paymentGateway: platformSettings.paymentGateway,
    paystackSecretKey: paystackKey,
    flutterwaveSecretKey: flutterwaveKey,
    demoMode: platformSettings.demoMode || false,
  };
}

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
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const [tenant, plan] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: invoice.tenantId }, select: { id: true, name: true, slug: true } }),
      prisma.subscriptionPlan.findUnique({ where: { id: invoice.planId }, select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } }),
    ]);

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    if (action === 'initialize') {
      return initializePayment(invoice, tenant, plan, gateway, authUser);
    }

    if (action === 'record') {
      return recordPayment(invoice, tenant, plan, body, authUser);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Invoice Payment POST error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

async function initializePayment(invoice: any, tenant: any, plan: any, gateway: string, authUser: any) {
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
    tenantName: tenant?.name,
    planName: plan?.displayName,
    billingCycle: invoice.billingCycle,
  };

  let paymentLink: string;
  let paymentGateway = gateway;

  const platformConfig = await getPlatformPaymentConfig();
  
  if (!platformConfig.paymentGatewayEnabled) {
    return NextResponse.json({ 
      error: 'Payment gateway not enabled. Please configure payment settings in Platform Settings.' 
    }, { status: 400 });
  }

  const effectiveGateway = platformConfig.paymentGateway || gateway;
  const paystackKey = platformConfig.paystackSecretKey;
  const flutterwaveKey = platformConfig.flutterwaveSecretKey;
  const isDemoMode = platformConfig.demoMode;

  if (isDemoMode || (!paystackKey && effectiveGateway === 'PAYSTACK') || (!flutterwaveKey && effectiveGateway === 'FLUTTERWAVE')) {
    const demoGateway = effectiveGateway === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : 'PAYSTACK';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${invoice.amount}&gateway=${demoGateway}`;
    paymentGateway = 'DEMO';
  } else if (effectiveGateway === 'PAYSTACK') {
    process.env.PAYSTACK_SECRET_KEY = paystackKey;
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
  } else if (effectiveGateway === 'FLUTTERWAVE') {
    if (!flutterwaveKey) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${invoice.amount}&gateway=FLUTTERWAVE`;
      paymentGateway = 'DEMO';
    } else {
      process.env.FLUTTERWAVE_SECRET_KEY = flutterwaveKey;
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

async function recordPayment(invoice: any, tenant: any, plan: any, body: any, authUser: any) {
  const { amount, method, transactionId, gatewayResponse, status, referenceNo, paymentGateway } = body;

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
      paymentGateway: paymentGateway || 'MANUAL',
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
