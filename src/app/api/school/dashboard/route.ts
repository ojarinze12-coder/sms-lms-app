import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasToken = !!(cookieStore.get('pcc-token') || cookieStore.get('scc-token') || cookieStore.get('auth-token'));
    
    console.log('[School Dashboard] Has token:', hasToken);
    
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
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: String(error) }, { status: 500 });
  }
}