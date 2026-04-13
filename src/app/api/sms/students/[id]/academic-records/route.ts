'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    console.log('[Academic Records] Auth user:', authUser?.userId, 'role:', authUser?.role);
    
    const { id: studentId } = await params;
    console.log('[Academic Records] Student ID:', studentId);
    
    // Verify student exists first
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true },
    });
    
    if (!student) {
      console.log('[Academic Records] Student not found:', studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    console.log('[Academic Records] Student:', student.firstName, student.lastName);
    
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    const where: any = { studentId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    const records = await prisma.academicRecord.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    console.log('[Academic Records] Found:', records.length, 'records');
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('[Academic Records] Error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch academic records', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In Next.js 15+, params is a Promise
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
        // Fixed: use authUser.userId instead of undefined session.user.id
        teacherId: teacherId || authUser.userId,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error creating academic record:', error);
    return NextResponse.json({ error: 'Failed to create academic record' }, { status: 500 });
  }
}
