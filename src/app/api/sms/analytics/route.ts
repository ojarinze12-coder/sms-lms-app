import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'term';
    const academicYearId = searchParams.get('academicYearId');

    // SuperAdmin: Show global analytics
    if (authUser.role === 'SUPER_ADMIN') {
      return getSuperAdminAnalytics();
    }

    // School Admin/Teacher: Show school-specific analytics
    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }
    return getSchoolAnalytics(authUser.tenantId, period, academicYearId || undefined);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function getSuperAdminAnalytics() {
  const [schoolCount, studentCount, teacherCount, courseCount, examCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.course.count(),
    prisma.exam.count(),
  ]);

  const subscriptions = await prisma.subscription.findMany({
    include: { plan: true },
  });

  const planCounts = { FREE: 0, STARTER: 0, PROFESSIONAL: 0, ENTERPRISE: 0 };
  subscriptions.forEach(s => {
    if (s.plan?.name && s.plan.name in planCounts) {
      planCounts[s.plan.name as keyof typeof planCounts]++;
    }
  });

  const freeSchools = planCounts.FREE;
  const paidSchools = planCounts.STARTER + planCounts.PROFESSIONAL + planCounts.ENTERPRISE;

  return NextResponse.json({
    overview: {
      schools: schoolCount,
      students: studentCount,
      teachers: teacherCount,
      courses: courseCount,
      exams: examCount,
    },
    subscriptions: {
      free: freeSchools,
      paid: paidSchools,
    },
  });
}

async function getSchoolAnalytics(tenantId: string, period: string, academicYearId?: string) {
  const whereClause: any = { tenantId };
  if (academicYearId) {
    whereClause.academicYearId = academicYearId;
  }

  // Core metrics
  const [studentCount, teacherCount, courseCount, examCount, enrollmentCount, classCount] = await Promise.all([
    prisma.student.count({ where: { tenantId } }),
    prisma.teacher.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.exam.count({ where: { subject: { academicClass: { academicYear: { tenantId } } } } }),
    prisma.enrollment.count({ where: { tenantId } }),
    prisma.academicClass.count({ where: { academicYear: { tenantId } } }),
  ]);

  // Fee analytics
  const feeStats = await getFeeAnalytics(tenantId);

  // Attendance analytics
  const attendanceStats = await getAttendanceAnalytics(tenantId);

  // Exam performance
  const examStats = await getExamAnalytics(tenantId);

  // Recent activity
  const recentExams = await prisma.exam.findMany({
    where: { subject: { academicClass: { academicYear: { tenantId } } } },
    select: { id: true, title: true, status: true, createdAt: true, subject: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Top performing students
  const topStudents = await prisma.result.findMany({
    where: {
      status: 'GRADED',
      exam: { subject: { academicClass: { academicYear: { tenantId } } } },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
    },
    orderBy: { percentage: 'desc' },
    take: 10
  });

  // Enrollment trend (by class)
  const enrollmentByClass = await prisma.enrollment.groupBy({
    by: ['classId'],
    _count: { studentId: true },
    where: { tenantId },
  });

  return NextResponse.json({
    overview: {
      students: studentCount,
      teachers: teacherCount,
      courses: courseCount,
      exams: examCount,
      enrollments: enrollmentCount,
      classes: classCount,
    },
    fees: feeStats,
    attendance: attendanceStats,
    exams: examStats,
    recentExams,
    topStudents: topStudents.map(r => ({
      id: r.student?.id,
      name: `${r.student?.firstName} ${r.student?.lastName}`,
      studentId: r.student?.studentId,
      score: r.percentage,
    })),
    enrollmentByClass,
  });
}

async function getFeeAnalytics(tenantId: string) {
  const payments = await prisma.feePayment.findMany({
    where: { tenantId },
    select: { amount: true, status: true, createdAt: true },
  });

  const totalGenerated = payments.length > 0 
    ? payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    : 0;

  const completedPayments = payments.filter(p => p.status === 'COMPLETED');
  const totalCollected = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const collectionRate = totalGenerated > 0 
    ? ((totalCollected / totalGenerated) * 100) 
    : 0;

  return {
    totalGenerated: Math.round(totalGenerated),
    totalCollected: Math.round(totalCollected),
    totalPending: Math.round(totalPending),
    collectionRate: Math.round(collectionRate * 10) / 10,
    paymentCount: payments.length,
  };
}

async function getAttendanceAnalytics(tenantId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendances = await prisma.attendance.findMany({
    where: {
      tenantId,
      date: { gte: thirtyDaysAgo },
    },
    select: { status: true },
  });

  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent = attendances.filter(a => a.status === 'ABSENT').length;
  const late = attendances.filter(a => a.status === 'LATE').length;
  const excused = attendances.filter(a => a.status === 'EXCUSED').length;

  return {
    present,
    absent,
    late,
    excused,
    total,
    presentRate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
    absentRate: total > 0 ? Math.round((absent / total) * 1000) / 10 : 0,
  };
}

async function getExamAnalytics(tenantId: string) {
  const results = await prisma.result.findMany({
    where: {
      exam: { subject: { academicClass: { academicYear: { tenantId } } } },
    },
    select: { status: true, percentage: true },
  });

  const gradedResults = results.filter(r => r.status === 'GRADED');
  const passCount = gradedResults.filter(r => (r.percentage || 0) >= 50).length;
  
  const passRate = gradedResults.length > 0 
    ? ((passCount / gradedResults.length) * 100) 
    : 0;
  
  const avgScore = gradedResults.length > 0
    ? (gradedResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / gradedResults.length)
    : 0;

  return {
    total: results.length,
    graded: gradedResults.length,
    passCount,
    passRate: Math.round(passRate * 10) / 10,
    averageScore: Math.round(avgScore * 10) / 10,
  };
}
