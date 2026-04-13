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
    
    console.log('[Academic Records] Student:', student.firstName, student.lastName);
    
    const { searchParams } = new URL(req.url);
    let academicYearId = searchParams.get('academicYearId');
    let termId = searchParams.get('termId');

    // Validate UUIDs before using in filter
    const isValidUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    
    if (academicYearId && !isValidUUID(academicYearId)) {
      academicYearId = null;
    }
    if (termId && !isValidUUID(termId)) {
      termId = null;
    }

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
