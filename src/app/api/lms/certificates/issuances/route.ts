'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const templateId = searchParams.get('templateId');

    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;
    if (templateId) where.templateId = templateId;

    const issuances = await prisma.certificateIssuance.findMany({
      where,
      include: {
        student: true,
        template: true,
        academicYear: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return NextResponse.json({ issuances });
  } catch (error) {
    console.error('Error fetching certificate issuances:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate issuances' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();

    const {
      studentId,
      templateId,
      academicYearId,
      recipientEmail,
      recipientName,
      notes,
    } = body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Certificate template not found' }, { status: 404 });
    }

    const certificateNo = `CERT-${template.name.substring(0, 3).toUpperCase()}-${student.studentId}-${Date.now()}`;

    const issuance = await prisma.certificateIssuance.create({
      data: {
        studentId,
        templateId,
        academicYearId,
        certificateNo,
        recipientEmail,
        recipientName,
        notes,
        status: 'GENERATED',
        issuedById: session.user.id,
        tenantId,
      },
      include: {
        student: true,
        template: true,
      },
    });

    return NextResponse.json({ issuance });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}