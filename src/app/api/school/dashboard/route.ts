import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    // Simple auth check - just check if we have any cookie
    const cookieStore = await cookies();
    const hasToken = !!(cookieStore.get('pcc-token') || cookieStore.get('scc-token') || cookieStore.get('auth-token'));
    
    console.log('[School Dashboard] Has token:', hasToken);
    
    // For now, return mock data to test the UI works
    // Remove this mock data after testing
    const mockStats = {
      students: 0,
      teachers: 0,
      classes: 0,
      revenue: 0,
      feesCollected: 0,
      attendance: 0,
    };
    
    return NextResponse.json({
      stats: mockStats,
      recentActivity: [],
      debug: { hasToken, message: 'Using mock data for testing' }
    });
    
    /* Original code - uncomment after testing
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized', debug: { hasToken } }, { status: 401 });
    }
    // ... rest of original code
    */
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: String(error) }, { status: 500 });
  }
}

    // Try fetching with better error handling
    let studentCount = 0;
    let teacherCount = 0;
    let classCount = 0;
    let feeSum = 0;

    try {
      studentCount = await prisma.student.count({ where: { tenantId } });
    } catch (e) {
      console.error('Student count error:', e);
    }

    try {
      teacherCount = await prisma.teacher.count({ where: { tenantId } });
    } catch (e) {
      console.error('Teacher count error:', e);
    }

    try {
      classCount = await prisma.academicClass.count({ where: { tenantId } });
    } catch (e) {
      console.error('Class count error:', e);
    }

    try {
      const feePayments = await prisma.feePayment.aggregate({
        where: { 
          tenantId,
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
        _sum: { amount: true },
      });
      feeSum = Number(feePayments._sum.amount || 0);
    } catch (e) {
      console.error('Fee payment error:', e);
    }

    const recentActivity: any[] = [];
    try {
      const students = await prisma.student.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      });
      recentActivity.push(...students.map(s => ({
        id: s.id,
        type: 'student',
        description: `New student: ${s.firstName} ${s.lastName}`,
        time: new Date(s.createdAt).toLocaleDateString(),
      })));
    } catch (e) {
      console.error('Recent activity error:', e);
    }

    const stats = {
      students: studentCount,
      teachers: teacherCount,
      classes: classCount,
      revenue: feeSum,
      feesCollected: feeSum,
      attendance: 94,
    };

    return NextResponse.json({
      stats,
      recentActivity: recentActivity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: String(error) }, { status: 500 });
  }
}
