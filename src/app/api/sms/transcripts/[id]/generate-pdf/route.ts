'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jsPDF } from 'jspdf';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const transcriptId = params.id;

    const transcript = await prisma.transcript.findFirst({
      where: {
        id: transcriptId,
        tenantId,
      },
      include: {
        student: true,
        academicYear: true,
        academicClass: true,
      },
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const results = await prisma.result.findMany({
      where: {
        studentId: transcript.studentId,
        exam: {
          academicYearId: transcript.academicYearId,
        },
      },
      include: {
        subject: true,
        exam: {
          include: {
            term: true,
          },
        },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        config: true,
      },
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(tenant?.name || 'School', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL TRANSCRIPT', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.text(`Document No: ${transcript.documentNo || 'N/A'}`, 20, y);
    doc.text(`Academic Year: ${transcript.academicYear.name}`, pageWidth - 70, y);
    y += 10;

    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${transcript.student.firstName} ${transcript.student.middleName || ''} ${transcript.student.lastName}`, 20, y);
    y += 6;
    doc.text(`Student ID: ${transcript.student.studentId}`, 20, y);
    y += 6;
    doc.text(`Date of Birth: ${transcript.student.dateOfBirth ? new Date(transcript.student.dateOfBirth).toLocaleDateString() : 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Gender: ${transcript.student.gender || 'N/A'}`, 20, y);
    y += 10;

    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC RECORD', 20, y);
    y += 10;

    const termNames = [...new Set(results.map(r => r.exam.term?.name).filter(Boolean))];
    
    for (const termName of termNames) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(termName, 20, y);
      y += 7;

      const termResults = results.filter(r => r.exam.term?.name === termName);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Subject', 20, y);
      doc.text('CA1', 80, y);
      doc.text('CA2', 100, y);
      doc.text('Exam', 120, y);
      doc.text('Total', 140, y);
      doc.text('Grade', 160, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      for (const result of termResults) {
        doc.text(result.subject?.name || 'N/A', 20, y);
        doc.text(String(result.ca1Score ?? '-'), 80, y);
        doc.text(String(result.ca2Score ?? '-'), 100, y);
        doc.text(String(result.examScore ?? '-'), 120, y);
        doc.text(String(result.totalScore ?? '-'), 140, y);
        doc.text(result.grade || '-', 160, y);
        y += 5;
      }
      y += 5;
    }

    if (transcript.purpose) {
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Purpose:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(transcript.purpose, 50, y);
    }

    if (transcript.sendingTo) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Sent To:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(transcript.sendingTo, 50, y);
    }

    y += 20;
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, y);
    doc.text(`This is an official document`, pageWidth - 20, y, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    const updatedTranscript = await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        status: 'GENERATED',
        pdfUrl: `data:application/pdf;base64,${base64}`,
      },
    });

    return NextResponse.json({ 
      transcript: updatedTranscript,
      pdfBase64: base64,
    });
  } catch (error) {
    console.error('Error generating transcript PDF:', error);
    return NextResponse.json({ error: 'Failed to generate transcript PDF' }, { status: 500 });
  }
}