import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const startDate = getStartDate(period);

    const [
      totalTenants,
      activeSubscriptions,
      totalRevenue,
      revenueByPlan,
      revenueHistory,
      churnData,
      newTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      getTotalRevenue(startDate),
      getRevenueByPlan(),
      getRevenueHistory(startDate),
      getChurnData(startDate),
      getNewTenants(startDate),
    ]);

    const avgRevenuePerUser = activeSubscriptions > 0 
      ? totalRevenue / activeSubscriptions 
      : 0;

    return NextResponse.json({
      overview: {
        totalTenants,
        activeSubscriptions,
        totalRevenue,
        avgRevenuePerUser,
        newTenantsThisPeriod: newTenants,
      },
      revenueByPlan,
      revenueHistory,
      churn: churnData,
      metrics: {
        mrr: totalRevenue,
        arr: totalRevenue * 12,
        churnRate: churnData.churnRate,
        netRevenueRetention: churnData.netRevenueRetention,
      },
    });
  } catch (error) {
    console.error('Admin Revenue Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue analytics' }, { status: 500 });
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '12m':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

async function getTotalRevenue(startDate: Date): Promise<number> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodStart: { gte: startDate },
    },
    include: { subscriptionPlan: true },
  });

  return subscriptions.reduce((total, sub) => {
    const price = sub.billingCycle === 'YEARLY' 
      ? (sub.subscriptionPlan?.yearlyPrice || 0) 
      : (sub.subscriptionPlan?.monthlyPrice || 0);
    return total + price;
  }, 0);
}

async function getRevenueByPlan(): Promise<Record<string, number>> {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { subscriptionPlan: true },
  });

  const revenue: Record<string, number> = {};
  for (const sub of subscriptions) {
    const planName = sub.subscriptionPlan?.name || 'UNKNOWN';
    const price = sub.billingCycle === 'YEARLY'
      ? (sub.subscriptionPlan?.yearlyPrice || 0)
      : (sub.subscriptionPlan?.monthlyPrice || 0);
    revenue[planName] = (revenue[planName] || 0) + price;
  }

  return revenue;
}

async function getRevenueHistory(startDate: Date): Promise<Array<{ month: string; revenue: number }>> {
  const history: Array<{ month: string; revenue: number }> = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    if (monthStart < startDate) break;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodStart: { lte: monthEnd },
      },
      include: { subscriptionPlan: true },
    });

    const revenue = subscriptions.reduce((total, sub) => {
      const price = sub.billingCycle === 'YEARLY'
        ? (sub.subscriptionPlan?.yearlyPrice || 0) / 12
        : (sub.subscriptionPlan?.monthlyPrice || 0);
      return total + price;
    }, 0);

    history.unshift({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue,
    });
  }

  return history;
}

async function getChurnData(startDate: Date): Promise<{ churnRate: number; netRevenueRetention: number }> {
  const cancelledBefore = await prisma.subscription.count({
    where: {
      status: { in: ['CANCELLED', 'EXPIRED'] },
      cancellationDate: { lt: startDate },
    },
  });

  const cancelledDuring = await prisma.subscription.count({
    where: {
      status: { in: ['CANCELLED', 'EXPIRED'] },
      cancellationDate: { gte: startDate },
    },
  });

  const totalAtStart = cancelledBefore + await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });

  const churnRate = totalAtStart > 0 
    ? (cancelledDuring / totalAtStart) * 100 
    : 0;

  return {
    churnRate: parseFloat(churnRate.toFixed(2)),
    netRevenueRetention: 100 - churnRate,
  };
}

async function getNewTenants(startDate: Date): Promise<number> {
  return prisma.tenant.count({
    where: {
      createdAt: { gte: startDate },
    },
  });
}
