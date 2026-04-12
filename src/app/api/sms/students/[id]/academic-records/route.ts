'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      // For testing - allow any request
      console.log('[Academic Records] No auth, allowing for test');
    }
    
    const studentId = params.id;
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    const where: any = {
      studentId,
    };

    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    const records = await prisma.academicRecord.findMany({
      where,
      include: {
        academicYear: true,
        term: true,
        academicClass: true,
        subject: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching academic records:', error);
    return NextResponse.json({ error: 'Failed to fetch academic records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = params.id;
    const body = await req.json();

    const {
      academicYearId,
      termId,
      classId,
      subjectId,
      ca1Score,
      ca2Score,
      examScore,
      totalScore,
      grade,
      gradePoint,
      remarks,
      position,
      attendance,
      daysPresent,
      daysAbsent,
      teacherId,
    } = body;

    const record = await prisma.academicRecord.create({
      data: {
        studentId,
        academicYearId,
        termId,
        classId,
        subjectId,
        ca1Score,
        ca2Score,
        examScore,
        totalScore,
        grade,
        gradePoint,
        remarks,
        position,
        attendance,
        daysPresent,
        daysAbsent,
        teacherId: teacherId || session.user.id,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error creating academic record:', error);
    return NextResponse.json({ error: 'Failed to create academic record' }, { status: 500 });
  }
}