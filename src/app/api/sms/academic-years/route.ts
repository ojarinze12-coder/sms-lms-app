import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || user.tenantId;

    const academicYears = await prisma.academicYear.findMany({
      where: { tenantId },
      include: {
        terms: true,
        classes: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(academicYears);
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, isActive } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { tenantId: user.tenantId },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
