import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import FeeReceiptPDF from '@/lib/receipts/FeeReceiptPDF';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptId, billId } = body;

    let receipt;
    if (receiptId) {
      receipt = await prisma.feeReceipt.findUnique({
        where: { id: receiptId },
      });
      if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    } else if (billId) {
      const bill = await prisma.studentFeeBill.findUnique({
        where: { id: billId },
      });
      if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

      const [student, academicYear, term] = await Promise.all([
        prisma.student.findUnique({ where: { id: bill.studentId }, select: { id: true, studentId: true, firstName: true, lastName: true } }),
        prisma.academicYear.findUnique({ where: { id: bill.academicYearId }, select: { id: true, name: true } }),
        prisma.term.findUnique({ where: { id: bill.termId }, select: { id: true, name: true } }),
      ]);
      const classEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: bill.studentId, academicClass: { academicYearId: bill.academicYearId } },
        include: { academicClass: { select: { name: true } } },
      });

      const receiptData = {
        receiptNo: `BILL-${bill.id.substring(0, 8).toUpperCase()}`,
        generatedAt: bill.generatedAt.toISOString(),
        studentName: `${student?.firstName || ''} ${student?.lastName || ''}`,
        studentId: student?.studentId || '',
        class: classEnrollment?.academicClass.name || 'N/A',
        academicYear: academicYear?.name || '',
        term: term?.name || '',
        items: [],
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
      };

      const pdfBuffer = await renderToBuffer(
        React.createElement(FeeReceiptPDF, { data: receiptData }) as any
      );

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="bill-${bill.id.substring(0, 8)}.pdf"`,
        },
      });
    } else {
      return NextResponse.json({ error: 'receiptId or billId is required' }, { status: 400 });
    }

    const [student, academicYear, term] = await Promise.all([
      prisma.student.findUnique({ where: { id: receipt.studentId }, select: { id: true, studentId: true, firstName: true, lastName: true } }),
      prisma.academicYear.findUnique({ where: { id: receipt.academicYearId }, select: { id: true, name: true } }),
      prisma.term.findUnique({ where: { id: receipt.termId }, select: { id: true, name: true } }),
    ]);

    const classEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: receipt.studentId, academicClass: { academicYearId: receipt.academicYearId } },
      include: { academicClass: { select: { name: true } } },
    });

    const bill = await prisma.studentFeeBill.findFirst({
      where: { id: receipt.billId },
    });
    if (!bill) return NextResponse.json({ error: 'Associated bill not found' }, { status: 404 });

    const receiptData = {
      receiptNo: receipt.receiptNo,
      generatedAt: receipt.generatedAt.toISOString(),
      studentName: `${student?.firstName || ''} ${student?.lastName || ''}`,
      studentId: student?.studentId || '',
      class: classEnrollment?.academicClass.name || 'N/A',
      academicYear: academicYear?.name || '',
      term: term?.name || '',
      items: [],
      totalAmount: bill.totalAmount,
      amountPaid: receipt.totalPaid,
      balance: bill.balance,
      paymentMethod: 'CASH',
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(FeeReceiptPDF, { data: receiptData }) as any
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${receipt.receiptNo}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}