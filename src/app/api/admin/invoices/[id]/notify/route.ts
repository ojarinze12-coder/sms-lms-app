import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { sendInvoiceCreatedEmail, sendPaymentReceiptEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoiceId, action } = body;

    if (action === 'send_reminder') {
      return sendInvoiceReminder(invoiceId);
    }

    if (action === 'resend_receipt') {
      return resendReceipt(invoiceId);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Invoice notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

async function sendInvoiceReminder(invoiceId: string) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true, plan: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'PAID') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
  }

  const tenantAdmin = await prisma.user.findFirst({
    where: { tenantId: invoice.tenantId, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenantAdmin?.email) {
    return NextResponse.json({ error: 'No admin email found' }, { status: 400 });
  }

  const billingPeriod = `${new Date(invoice.billingPeriodStart).toLocaleDateString('en-NG')} - ${new Date(invoice.billingPeriodEnd).toLocaleDateString('en-NG')}`;

  await sendInvoiceCreatedEmail(
    tenantAdmin.email,
    invoice.tenant.name,
    invoice.invoiceNumber,
    invoice.amount,
    invoice.currency,
    new Date(invoice.dueDate).toLocaleDateString('en-NG'),
    billingPeriod,
    invoice.plan.displayName
  );

  return NextResponse.json({ success: true, message: 'Reminder sent' });
}

async function resendReceipt(invoiceId: string) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true, plan: true, payments: { where: { status: 'COMPLETED' } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const payment = invoice.payments[0];
  if (!payment) {
    return NextResponse.json({ error: 'No payment found for this invoice' }, { status: 400 });
  }

  const tenantAdmin = await prisma.user.findFirst({
    where: { tenantId: invoice.tenantId, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenantAdmin?.email) {
    return NextResponse.json({ error: 'No admin email found' }, { status: 400 });
  }

  const billingPeriod = `${new Date(invoice.billingPeriodStart).toLocaleDateString('en-NG')} - ${new Date(invoice.billingPeriodEnd).toLocaleDateString('en-NG')}`;

  await sendPaymentReceiptEmail(
    tenantAdmin.email,
    invoice.tenant.name,
    invoice.invoiceNumber,
    payment.receiptNumber || 'N/A',
    payment.amount,
    payment.currency,
    payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-NG') : 'N/A',
    billingPeriod,
    invoice.plan.displayName,
    payment.method,
    payment.paymentGateway
  );

  return NextResponse.json({ success: true, message: 'Receipt resent' });
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to send invoice notifications' });
}
