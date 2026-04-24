import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  console.log('[portal] Step 1 - authUser:', authUser);
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 });
  }

  try {
    // Simple student lookup - no includes
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: authUser.userId },
          { email: { mode: 'insensitive', equals: authUser.email } },
        ]
      }
    });

    console.log('[portal] Step 2 - Student found:', student?.id, student?.studentId);

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Simple enrollments - no nested includes
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id }
    });

    console.log('[portal] Step 3 - Enrollments:', enrollments?.length);

    // Simple results - no includes
    const results = await prisma.result.findMany({
      where: { studentId: student.id },
      take: 20
    });

    console.log('[portal] Step 4 - Results:', results?.length);

    // Simple attendances
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      take: 30
    });

    console.log('[portal] Step 5 - Attendances:', attendances?.length);

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
      },
      enrollments: enrollments || [],
      results: results || [],
      attendances: attendances || [],
      enrollmentsCount: enrollments.length,
      resultsCount: results.length,
      attendancesCount: attendances.length,
    });
  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Failed to fetch data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}