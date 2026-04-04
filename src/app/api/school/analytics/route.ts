import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30';

    const [studentCount, teacherCount, feePayments] = await Promise.all([
      prisma.student.count({ where: { tenantId } }),
      prisma.teacher.count({ where: { tenantId } }),
      prisma.feePayment.aggregate({
        where: { 
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const overview = {
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalRevenue: feePayments._sum.amount || 0,
      averageAttendance: 94,
    };

    const enrollmentTrend = [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 48 },
      { month: 'Apr', count: 55 },
      { month: 'May', count: 62 },
      { month: 'Jun', count: 58 },
    ];

    const revenueByMonth = [
      { month: 'Jan', amount: 3500000 },
      { month: 'Feb', amount: 4200000 },
      { month: 'Mar', amount: 3800000 },
      { month: 'Apr', amount: 4500000 },
      { month: 'May', amount: 5200000 },
      { month: 'Jun', amount: 4800000 },
    ];

    const subjectPerformance = [
      { subject: 'Mathematics', average: 78 },
      { subject: 'English', average: 82 },
      { subject: 'Science', average: 75 },
      { subject: 'Computer', average: 88 },
      { subject: 'Arts', average: 80 },
    ];

    const classPerformance = [
      { class: 'JSS 1', average: 82 },
      { class: 'JSS 2', average: 78 },
      { class: 'JSS 3', average: 85 },
      { class: 'SSS 1', average: 76 },
      { class: 'SSS 2', average: 80 },
    ];

    return NextResponse.json({
      overview,
      enrollmentTrend,
      revenueByMonth,
      subjectPerformance,
      classPerformance,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
