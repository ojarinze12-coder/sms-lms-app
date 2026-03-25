import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
  }

  try {
    const [schoolCount, studentCount, teacherCount, courseCount, examCount, subscriptionCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.course.count(),
      prisma.exam.count(),
      prisma.subscription.count(),
    ]);

    const subscriptions = await prisma.subscription.findMany({
      include: { plan: true },
    });

    const planCounts = {
      FREE: 0,
      STARTER: 0,
      PROFESSIONAL: 0,
      ENTERPRISE: 0,
    };

    const statusCounts = {
      ACTIVE: 0,
      PAST_DUE: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };

    subscriptions.forEach(sub => {
      if (sub.plan?.name && sub.plan.name in planCounts) {
        planCounts[sub.plan.name as keyof typeof planCounts] += 1;
      }
      if (sub.status && sub.status in statusCounts) {
        statusCounts[sub.status as keyof typeof statusCounts] += 1;
      }
    });

    const recentSchools = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        plan: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const examResults = await prisma.result.findMany({
      select: { status: true, percentage: true }
    });

    const gradedResults = examResults.filter(r => r.status === 'GRADED');
    const passCount = gradedResults.filter(r => (r.percentage || 0) >= 50).length;
    const passRate = gradedResults.length > 0 
      ? ((passCount / gradedResults.length) * 100)
      : 0;
    
    const avgScore = gradedResults.length > 0
      ? (gradedResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / gradedResults.length)
      : 0;

    return NextResponse.json({
      overview: {
        schools: schoolCount,
        students: studentCount,
        teachers: teacherCount,
        courses: courseCount,
        exams: examCount,
        subscriptions: subscriptionCount,
      },
      performance: {
        passRate: parseFloat(passRate.toFixed(1)),
        averageScore: parseFloat(avgScore.toFixed(1)),
        totalGradedExams: gradedResults.length,
      },
      subscriptions: {
        plans: planCounts,
        statuses: statusCounts,
      },
      recentSchools: recentSchools || [],
    });
  } catch (error) {
    console.error('Admin Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
