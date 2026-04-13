import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import crypto from 'crypto';

const createInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  billingPeriodStart: z.string().datetime(),
  billingPeriodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.subscriptionInvoice.findFirst({
    orderBy: { createdAt: 'desc' },
    where: { invoiceNumber: { startsWith: `INV-${year}` } },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  const isAuthenticated = !!authUser;

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    const invoices = await prisma.subscriptionInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.subscriptionInvoice.count({ where });

    const invoiceIds = invoices.map(inv => inv.id);
    const tenantIds = Array.from(new Set(invoices.map(inv => inv.tenantId)));
    const planIds = Array.from(new Set(invoices.map(inv => inv.planId)));

    const [tenants, plans, paymentsMap] = await Promise.all([
      prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true, slug: true },
      }),
      prisma.subscriptionPlan.findMany({
        where: { id: { in: planIds } },
        select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true },
      }),
      prisma.subscriptionPayment.findMany({
        where: { invoiceId: { in: invoiceIds } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const tenantMap = new Map(tenants.map(t => [t.id, t]));
    const planMap = new Map(plans.map(p => [p.id, p]));
    const paymentsByInvoice = new Map<string, typeof paymentsMap>();
    for (const payment of paymentsMap) {
      const existing = paymentsByInvoice.get(payment.invoiceId) || [];
      existing.push(payment);
      paymentsByInvoice.set(payment.invoiceId, existing);
    }

    const enrichedInvoices = invoices.map(inv => ({
      ...inv,
      tenant: tenantMap.get(inv.tenantId),
      plan: planMap.get(inv.planId),
      payments: paymentsByInvoice.get(inv.id) || [],
    }));

    return NextResponse.json({
      invoices: enrichedInvoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      isAuthenticated,
    });
  } catch (error) {
    console.error('Admin Invoices GET error:', error);
    return NextResponse.json({ 
      invoices: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      isAuthenticated,
      error: 'Failed to fetch invoices' 
    });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: { tenantId: validatedData.tenantId, status: 'ACTIVE' },
    });

    if (!activeSubscription || !activeSubscription.planId) {
      return NextResponse.json({ error: 'Tenant has no active subscription' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: activeSubscription.planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const amount = validatedData.billingCycle === 'YEARLY' 
      ? plan.yearlyPrice 
      : plan.monthlyPrice;

    if (amount <= 0) {
      return NextResponse.json({ error: 'Plan has no billing amount' }, { status: 400 });
    }

    const existingPendingInvoice = await prisma.subscriptionInvoice.findFirst({
      where: {
        tenantId: validatedData.tenantId,
        billingPeriodStart: new Date(validatedData.billingPeriodStart),
        status: 'PENDING',
      },
    });

    if (existingPendingInvoice) {
      return NextResponse.json({ 
        error: 'Pending invoice already exists for this billing period',
        invoice: existingPendingInvoice,
      }, { status: 400 });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        tenantId: validatedData.tenantId,
        subscriptionId: activeSubscription.id,
        planId: activeSubscription.planId,
        amount,
        billingCycle: validatedData.billingCycle,
        billingPeriodStart: new Date(validatedData.billingPeriodStart),
        billingPeriodEnd: new Date(validatedData.billingPeriodEnd),
        dueDate: new Date(validatedData.dueDate),
        description: validatedData.description || `${plan.displayName} - ${validatedData.billingCycle} subscription`,
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'INVOICE_CREATED',
        actionType: 'CREATE',
        category: 'BILLING',
        targetType: 'invoice',
        targetId: invoice.id,
        targetName: invoiceNumber,
        description: `Created invoice ${invoiceNumber} for ${tenant.name}`,
        metadata: { tenantId: tenant.id, amount, billingCycle: validatedData.billingCycle },
      },
    });

    return NextResponse.json({
      invoice: {
        ...invoice,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        plan: { id: plan.id, name: plan.name, displayName: plan.displayName, monthlyPrice: plan.monthlyPrice, yearlyPrice: plan.yearlyPrice },
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Invoices POST error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
