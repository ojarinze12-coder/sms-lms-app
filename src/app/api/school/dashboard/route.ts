import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyToken, JWTPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Check Authorization header first
  const authHeader = headersList.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = verifyToken(token);
    if (result) return result;
  }
  
  // Check cookies
  const pccToken = cookieStore.get('pcc-token')?.value;
  const sccToken = cookieStore.get('scc-token')?.value;
  const legacyToken = cookieStore.get('auth-token')?.value;
  
  if (pccToken) return verifyToken(pccToken);
  if (sccToken) return verifyToken(sccToken);
  if (legacyToken) return verifyToken(legacyToken);
  
  return null;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Fetch real data from database
    const [studentCount, teacherCount, classCount] = await Promise.all([
      prisma.student.count({ where: { tenantId: authUser.tenantId } }),
      prisma.teacher.count({ where: { tenantId: authUser.tenantId } }),
      prisma.academicClass.count({ where: { tenantId: authUser.tenantId } }),
    ]);

    const stats = {
      students: studentCount,
      teachers: teacherCount,
      classes: classCount,
      revenue: 0,
      feesCollected: 0,
      attendance: 0,
    };
    
    return NextResponse.json({
      stats,
      recentActivity: [],
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: String(error) }, { status: 500 });
  }
}