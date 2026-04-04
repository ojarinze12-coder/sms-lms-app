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
    const academicYearId = searchParams.get('academicYearId');

    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;

    const transcripts = await prisma.transcript.findMany({
      where,
      include: {
        student: true,
        academicYear: true,
        academicClass: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
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
      academicYearId,
      classId,
      purpose,
      sendingTo,
      notes,
    } = body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    const documentNo = `TR-${academicYear?.name.replace('/', '-')}-${student.studentId}-${Date.now()}`;

    const transcript = await prisma.transcript.create({
      data: {
        studentId,
        academicYearId,
        classId,
        documentNo,
        purpose,
        sendingTo,
        notes,
        status: 'GENERATED',
        tenantId,
      },
      include: {
        student: true,
        academicYear: true,
      },
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error creating transcript:', error);
    return NextResponse.json({ error: 'Failed to create transcript' }, { status: 500 });
  }
}