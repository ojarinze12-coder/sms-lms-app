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
    // Find student by userId or email within the same tenant - restore working lookup
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: authUser.userId },
          { email: authUser.email },
        ],
        tenantId: authUser.tenantId
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found. Please contact admin.' }, { status: 404 });
    }

    // Fetch grading scale from school settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: { gradingScale: true }
    });

    let gradingScale = null;
    if (settings?.gradingScale) {
      const tenantModule = await prisma.tenantModule.findFirst({
        where: { tenantId: authUser.tenantId, moduleKey: 'grading_scales' }
      });
      const config = tenantModule?.config as { scales?: any[] } || {};
      const scales = config.scales || [];
      gradingScale = scales.find((s: any) => s.name === settings.gradingScale) || scales.find((s: any) => s.isDefault) || scales[0] || null;
    }

    // Filter by student's branch
    const branchFilter = student.branchId ? { branchId: student.branchId } : {};

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, ...branchFilter },
      include: {
        academicClass: {
          include: {
            subjects: {
              include: {
                teacher: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    });

    const results = await prisma.result.findMany({
      where: { studentId: student.id, ...branchFilter },
      include: {
        exam: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            term: { 
              select: { id: true, name: true, academicYear: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { gradedAt: 'desc' },
      take: 20
    });

    const reportCards = await prisma.reportCard.findMany({
      where: { studentId: student.id, ...branchFilter },
      include: {
        term: { 
          select: { id: true, name: true, academicYear: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id, ...branchFilter },
      orderBy: { date: 'desc' },
      take: 30
    });

    const assignments = await prisma.assignmentSubmission.findMany({
      where: { studentId: student.id, ...branchFilter },
      include: {
        assignment: {
          include: {
            course: { select: { name: true } }
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 10
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId: student.tenantId,
        isPublished: true,
        OR: [
          { targetRoles: { has: 'STUDENT' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const currentClass = enrollments.find(e => e.status === 'ACTIVE')?.academicClass;

    let timetable = [];
    if (currentClass) {
      timetable = await prisma.timetableSlot.findMany({
        where: {
          academicClassId: currentClass.id,
        },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
    }

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        branchId: student.branchId,
        class: currentClass || null,
      },
      gradingScale,
      enrollments: enrollments || [],
      results: results || [],
      reportCards: reportCards || [],
      attendances: attendances || [],
      assignments: assignments || [],
      announcements: announcements || [],
      timetable: timetable || [],
    });
  } catch (error) {
    console.error('Error fetching student portal data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}