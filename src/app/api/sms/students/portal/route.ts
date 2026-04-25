import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 });
  }

  try {
    // Step 1: Find student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: authUser.userId },
          { email: { mode: 'insensitive', equals: authUser.email } },
        ]
      }
    });

    console.log('[portal] Student found:', student?.id);

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Step 2: Enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: { academicClass: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log('[portal] Enrollments:', enrollments?.length);

    // Get active enrollment for class display
    const activeEnrollment = enrollments?.find(e => e.status === 'ACTIVE');

    // Step 3: Results
    const results = await prisma.result.findMany({
      where: { studentId: student.id },
      take: 20
    });
    console.log('[portal] Results:', results?.length);

    // Step 4: Attendances
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      take: 30
    });
    console.log('[portal] Attendances:', attendances?.length);

    // Step 5: Assignments
    const assignments = await prisma.assignmentSubmission.findMany({
      where: { studentId: student.id },
      take: 10
    });
    console.log('[portal] Assignments:', assignments?.length);

    // Step 6: Announcements (simplified - no tenantId filter)
    let announcements = [];
    try {
      announcements = await prisma.announcement.findMany({
        where: { isPublished: true },
        take: 10
      });
    } catch (e) {
      console.log('[portal] Announcements query failed:', e);
    }
    console.log('[portal] Announcements:', announcements?.length);

    // Step 7: Exams for student's enrolled classes (filter by time window)
    let exams = [];
    try {
      // Get student's enrolled class IDs from active enrollments
      const classIds = enrollments
        .filter(e => e.status === 'ACTIVE')
        .map(e => e.classId);

      if (classIds.length > 0) {
        exams = await prisma.exam.findMany({
          where: {
            isPublished: true,
            academicClassId: { in: classIds },
            startTime: { lte: new Date() },
            endTime: { gte: new Date() }
          },
          include: {
            subject: true,
            term: true
          },
          orderBy: { startTime: 'desc' },
          take: 20
        });
      }
    } catch (e) {
      console.log('[portal] Exams query failed:', e);
    }
    console.log('[portal] Exams:', exams?.length);

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        academicClass: activeEnrollment?.academicClass || null,
      },
      enrollments: enrollments || [],
      results: results || [],
      attendances: attendances || [],
      assignments: assignments || [],
      announcements: announcements || [],
      exams: exams || [],
    });
  } catch (error) {
    console.error('[portal] Error:', error);
    console.error('[portal] Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Failed to fetch data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}