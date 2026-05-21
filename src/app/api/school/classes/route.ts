import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const userBranchId = user.branchId;

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const tierId = searchParams.get('tierId');

    const where: any = { academicYear: { tenantId } };
    if (userBranchId) where.branchId = userBranchId;
    if (branchId) where.branchId = branchId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (tierId) where.tierId = tierId;

    const classes = await prisma.academicClass.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, level: true },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
