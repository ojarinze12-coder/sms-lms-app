import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

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

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantId, dryRun } = body;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        planId: { not: null },
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: true,
        plan: true,
      },
    });

    const results = [];
    const now = new Date();

    for (const subscription of subscriptions) {
      if (!subscription.planId || !subscription.plan) continue;

      const billingCycle = subscription.billingCycle;
      const periodStart = subscription.currentPeriodStart || now;
      const periodEnd = subscription.currentPeriodEnd || new Date(
        now.getTime() + (billingCycle === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000
      );

      let nextBillingDate: Date;
      let dueDate: Date;

      if (billingCycle === 'MONTHLY') {
        nextBillingDate = new Date(periodEnd);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        dueDate = new Date(periodEnd);
        dueDate.setDate(dueDate.getDate() + 7);
      } else {
        nextBillingDate = new Date(periodEnd);
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        dueDate = new Date(periodEnd);
        dueDate.setDate(dueDate.getDate() + 14);
      }

      const existingInvoice = await prisma.subscriptionInvoice.findFirst({
        where: {
          tenantId: subscription.tenantId!,
          billingPeriodStart: { gte: new Date(periodStart.getTime() - 86400000) },
          status: { in: ['PENDING', 'PAID'] },
        },
      });

      if (existingInvoice) {
        results.push({
          tenantId: subscription.tenantId,
          tenantName: subscription.tenant?.name,
          status: 'SKIPPED',
          reason: 'Invoice already exists for this period',
        });
        continue;
      }

      const amount = billingCycle === 'YEARLY'
        ? subscription.plan.yearlyPrice
        : subscription.plan.monthlyPrice;

      if (amount <= 0) {
        results.push({
          tenantId: subscription.tenantId,
          tenantName: subscription.tenant?.name,
          status: 'SKIPPED',
          reason: 'Plan has no billing amount',
        });
        continue;
      }

      if (dryRun) {
        results.push({
          tenantId: subscription.tenantId,
          tenantName: subscription.tenant?.name,
          status: 'WOULD_CREATE',
          amount,
          billingCycle,
          periodStart,
          periodEnd,
        });
        continue;
      }

      const invoiceNumber = await generateInvoiceNumber();

      const invoice = await prisma.subscriptionInvoice.create({
        data: {
          invoiceNumber,
          tenantId: subscription.tenantId!,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          amount,
          currency: 'NGN',
          status: 'PENDING',
          billingCycle,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          dueDate,
          description: `${subscription.plan.displayName} - ${billingCycle} subscription`,
        },
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: periodEnd,
          currentPeriodEnd: nextBillingDate,
          nextBillingDate,
        },
      });

      await prisma.platformAuditLog.create({
        data: {
          actorType: 'SYSTEM',
          actorEmail: 'system@pccedu.com',
          action: 'INVOICE_GENERATED',
          actionType: 'CREATE',
          category: 'BILLING',
          targetType: 'invoice',
          targetId: invoice.id,
          targetName: invoiceNumber,
          description: `Auto-generated invoice ${invoiceNumber} for ${subscription.tenant?.name}`,
          metadata: { tenantId: subscription.tenantId, amount, billingCycle },
        },
      });

      results.push({
        tenantId: subscription.tenantId,
        tenantName: subscription.tenant?.name,
        status: 'CREATED',
        invoiceNumber,
        amount,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.filter((r: any) => r.status === 'CREATED').length,
      skipped: results.filter((r: any) => r.status === 'SKIPPED').length,
      dryRun: !!dryRun,
      results,
    });
  } catch (error) {
    console.error('Generate recurring invoices error:', error);
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to generate recurring invoices. Add { dryRun: true } to preview.'
  });
}
