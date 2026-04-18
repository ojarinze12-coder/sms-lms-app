import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyToken, JWTPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Check branch from query params
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');
  
  // Check Authorization header first
  const authHeader = headersList.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = verifyToken(token);
    if (result) return { ...result, branchId };
  }
  
  // Check cookies
  const pccToken = cookieStore.get('pcc-token')?.value;
  const sccToken = cookieStore.get('scc-token')?.value;
  const legacyToken = cookieStore.get('auth-token')?.value;
  
  if (pccToken) return { ...verifyToken(pccToken), branchId };
  if (sccToken) return { ...verifyToken(sccToken), branchId };
  if (legacyToken) return { ...verifyToken(legacyToken), branchId };
  
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    
    const authUser = await getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Build branch-aware filters
    const studentWhere: any = { tenantId: authUser.tenantId };
    const teacherWhere: any = { tenantId: authUser.tenantId };
    const classWhere: any = { tenantId: authUser.tenantId };
    
    if (branchId) {
      studentWhere.branchId = branchId;
      teacherWhere.branchId = branchId;
      classWhere.branchId = branchId;
    }

    // Fetch real data from database
    const [studentCount, teacherCount, classCount] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.teacher.count({ where: teacherWhere }),
      prisma.academicClass.count({ where: classWhere }),
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
      branchId,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: String(error) }, { status: 500 });
  }
}