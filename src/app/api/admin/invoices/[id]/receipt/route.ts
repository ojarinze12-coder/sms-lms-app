import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true, domain: true, brandColor: true, logo: true } },
        plan: { select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } },
        subscription: { select: { id: true, billingCycle: true } },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const payment = invoice.payments[0];
    const receiptNumber = payment?.receiptNumber || `RCP-${Date.now()}`;

    const receipt = {
      receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date().toISOString(),
      
      from: {
        name: 'PCC Educational Solutions',
        address: 'Lagos, Nigeria',
        email: 'billing@pccedu.com',
        phone: '+234-XXX-XXX-XXXX',
      },
      
      to: {
        name: invoice.tenant.name,
        domain: invoice.tenant.domain,
      },
      
      invoice: {
        amount: invoice.amount,
        currency: invoice.currency,
        billingCycle: invoice.billingCycle,
        billingPeriod: {
          start: invoice.billingPeriodStart.toISOString(),
          end: invoice.billingPeriodEnd.toISOString(),
        },
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
        description: invoice.description,
      },
      
      payment: payment ? {
        amount: payment.amount,
        paidAt: payment.paidAt?.toISOString(),
        method: payment.method,
        referenceNo: payment.referenceNo,
        transactionId: payment.transactionId,
        gateway: payment.paymentGateway,
      } : null,
      
      plan: {
        name: invoice.plan.displayName,
        monthlyPrice: invoice.plan.monthlyPrice,
        yearlyPrice: invoice.plan.yearlyPrice,
      },
    };

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Admin Invoice Receipt GET error:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
