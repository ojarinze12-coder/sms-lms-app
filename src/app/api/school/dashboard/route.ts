import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const [studentCount, teacherCount, classCount, feePayments, recentActivity] = await Promise.all([
      prisma.student.count({ where: { tenantId } }),
      prisma.teacher.count({ where: { tenantId } }),
      prisma.class.count({ where: { tenantId } }),
      prisma.feePayment.aggregate({
        where: { 
          tenantId,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First of month
          },
        },
        _sum: { amount: true },
      }),
      prisma.student.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
    ]);

    const stats = {
      students: studentCount,
      teachers: teacherCount,
      classes: classCount,
      revenue: feePayments._sum.amount?.toNumber() || 0,
      feesCollected: feePayments._sum.amount?.toNumber() || 0,
      attendance: 94, // Placeholder
    };

    const formattedActivity = recentActivity.map(s => ({
      id: s.id,
      type: 'student',
      description: `New student enrolled: ${s.firstName} ${s.lastName}`,
      time: new Date(s.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      stats,
      recentActivity: formattedActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
