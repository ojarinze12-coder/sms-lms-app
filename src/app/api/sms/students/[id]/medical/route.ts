'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const studentId = params.id;

    const medicalRecords = await prisma.studentMedicalRecord.findMany({
      where: {
        studentId,
        tenantId,
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    return NextResponse.json({ records: medicalRecords });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const studentId = params.id;
    const body = await req.json();

    const {
      visitType,
      visitDate,
      diagnosis,
      symptoms,
      treatment,
      prescribedMed,
      doctorName,
      doctorContact,
      nextVisitDate,
      attachments,
      notes,
      isConfidential,
    } = body;

    const record = await prisma.studentMedicalRecord.create({
      data: {
        studentId,
        tenantId,
        visitType: visitType || 'CHECKUP',
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        diagnosis,
        symptoms,
        treatment,
        prescribedMed,
        doctorName,
        doctorContact,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
        attachments: attachments || [],
        notes,
        isConfidential: isConfidential || false,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error creating medical record:', error);
    return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 });
  }
}