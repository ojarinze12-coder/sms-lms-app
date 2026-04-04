import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (invoiceId) {
      const invoice = await prisma.subscriptionInvoice.findUnique({
        where: { id: invoiceId, tenantId: user.tenantId },
        include: {
          subscriptionPlan: { select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } },
          subscription: { select: { id: true, billingCycle: true } },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json({ invoice });
    }

    const where: any = { tenantId: user.tenantId };
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        include: {
          subscriptionPlan: { select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptionInvoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Tenant Invoices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, invoiceId, gateway = 'PAYSTACK' } = body;

    if (action === 'initialize') {
      return initializePayment(user, invoiceId, gateway);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tenant Invoices POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function initializePayment(user: any, invoiceId: string, gateway: string) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId, tenantId: user.tenantId },
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

  const email = user.email;
  
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
