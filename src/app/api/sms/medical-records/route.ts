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

    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;

    const records = await prisma.studentMedicalRecord.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 });
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
      visitType,
      visitDate,
      diagnosis,
      symptoms,
      treatment,
      prescribedMed,
      doctorName,
      nextVisitDate,
      notes,
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
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
        notes,
        createdById: session.user.id,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error creating medical record:', error);
    return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 });
  }
}