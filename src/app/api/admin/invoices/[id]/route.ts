import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import crypto from 'crypto';

const updateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PAID']).optional(),
  notes: z.string().optional(),
});

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
        tenant: { select: { id: true, name: true, slug: true, domain: true, plan: true } },
        plan: { select: { id: true, name: true, displayName: true, monthlyPrice: true, yearlyPrice: true } },
        subscription: { select: { id: true, status: true, billingCycle: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Admin Invoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
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
    const validatedData = updateInvoiceSchema.parse(body);

    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updatedInvoice = await prisma.subscriptionInvoice.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        paidAt: validatedData.status === 'PAID' ? new Date() : undefined,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, displayName: true } },
      },
    });

    if (validatedData.status === 'PAID' && invoice.status !== 'PAID') {
      await prisma.platformAuditLog.create({
        data: {
          actorType: 'SUPER_ADMIN',
          actorId: authUser.userId,
          actorEmail: authUser.email,
          action: 'INVOICE_MARKED_PAID',
          actionType: 'UPDATE',
          category: 'BILLING',
          targetType: 'invoice',
          targetId: invoice.id,
          targetName: invoice.invoiceNumber,
          description: `Invoice ${invoice.invoiceNumber} marked as paid`,
        },
      });
    }

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Invoice PUT error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
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
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete paid invoice' }, { status: 400 });
    }

    await prisma.subscriptionInvoice.delete({ where: { id } });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'INVOICE_DELETED',
        actionType: 'DELETE',
        category: 'BILLING',
        targetType: 'invoice',
        targetId: id,
        targetName: invoice.invoiceNumber,
        description: `Deleted invoice ${invoice.invoiceNumber}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Invoice DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
