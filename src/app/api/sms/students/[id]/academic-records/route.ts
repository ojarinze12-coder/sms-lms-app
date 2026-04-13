'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;

    const records = await prisma.academicRecord.findMany({
      where: { studentId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('[Academic Records] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch academic records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: studentId } = await params;
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
        teacherId: teacherId || authUser.userId,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error creating academic record:', error);
    return NextResponse.json({ error: 'Failed to create academic record' }, { status: 500 });
  }
}