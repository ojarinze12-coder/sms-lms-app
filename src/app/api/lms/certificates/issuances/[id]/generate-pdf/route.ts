'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const issuanceId = params.id;

    const issuance = await prisma.certificateIssuance.findFirst({
      where: {
        id: issuanceId,
        tenantId,
      },
      include: {
        student: true,
        template: true,
        academicYear: true,
      },
    });

    if (!issuance) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(250, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(tenant?.name || 'School', pageWidth / 2, 35, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(212, 175, 55);
    doc.text('CERTIFICATE', pageWidth / 2, 55, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('is hereby awarded to', pageWidth / 2, 75, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const studentName = `${issuance.student.firstName} ${issuance.student.lastName}`;
    doc.text(studentName, pageWidth / 2, 95, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('for successfully completing', pageWidth / 2, 115, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(issuance.template.name, pageWidth / 2, 135, { align: 'center' });

    if (issuance.template.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(issuance.template.description, pageWidth / 2, 150, { align: 'center' });
    }

    if (issuance.academicYear) {
      doc.setFontSize(11);
      doc.text(`Academic Year: ${issuance.academicYear.name}`, pageWidth / 2, 165, { align: 'center' });
    }

    const qrData = JSON.stringify({
      certNo: issuance.certificateNo,
      student: studentName,
      template: issuance.template.name,
      issuedAt: issuance.issuedAt,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 80 });
    
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 45, pageHeight - 50, 25, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate No:', 30, pageHeight - 45);
    doc.setFont('helvetica', 'normal');
    doc.text(issuance.certificateNo, 65, pageHeight - 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Date of Issue:', 30, pageHeight - 38);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(issuance.issuedAt).toLocaleDateString(), 65, pageHeight - 38);

    const signatureY = pageHeight - 60;
    doc.setLineWidth(0.5);
    doc.line(40, signatureY, 90, signatureY);
    doc.setFontSize(8);
    doc.text('Principal', 65, signatureY + 5, { align: 'center' });

    doc.line(pageWidth - 90, signatureY, pageWidth - 40, signatureY);
    doc.text('Director', pageWidth - 65, signatureY + 5, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Verify at: your-school-domain.com/verify', pageWidth / 2, pageHeight - 15, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    const updatedIssuance = await prisma.certificateIssuance.update({
      where: { id: issuanceId },
      data: {
        status: 'GENERATED',
        pdfUrl: `data:application/pdf;base64,${base64}`,
        qrCode: qrCodeDataUrl,
      },
    });

    return NextResponse.json({ 
      issuance: updatedIssuance,
      pdfBase64: base64,
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return NextResponse.json({ error: 'Failed to generate certificate PDF' }, { status: 500 });
  }
}