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
    let schoolCount = 0, studentCount = 0, teacherCount = 0, courseCount = 0, examCount = 0, subscriptionCount = 0;

    try { schoolCount = await prisma.tenant.count(); } catch (e) { console.error('tenant count error:', e); }
    try { studentCount = await prisma.student.count(); } catch (e) { console.error('student count error:', e); }
    try { teacherCount = await prisma.teacher.count(); } catch (e) { console.error('teacher count error:', e); }
    try { courseCount = await prisma.course.count(); } catch (e) { console.error('course count error:', e); }
    try { examCount = await prisma.exam.count(); } catch (e) { console.error('exam count error:', e); }
    try { subscriptionCount = await prisma.subscription.count(); } catch (e) { console.error('subscription count error:', e); }

    const subscriptions = await prisma.subscription.findMany({
      include: { subscriptionPlan: true },
    }).catch(() => []);

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
      if (sub.subscriptionPlan?.name && sub.subscriptionPlan.name in planCounts) {
        planCounts[sub.subscriptionPlan.name as keyof typeof planCounts] += 1;
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
