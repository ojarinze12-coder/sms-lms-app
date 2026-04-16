import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ years: [] });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || user.tenantId;
    const branchId = searchParams.get('branchId');

    const whereClause: any = { tenantId };
    if (branchId) {
      whereClause.OR = [
        { branchId },
        { branchId: null },
      ];
    }

    const academicYears = await prisma.academicYear.findMany({
      where: whereClause,
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ years: academicYears });
  } catch (error: any) {
    return NextResponse.json({ years: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, isActive, branchId } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    console.log('Creating academic year:', name, 'for tenant:', user.tenantId);

    // Check if year exists for this tenant (considering branch)
    const existingYear = await prisma.academicYear.findFirst({
      where: { 
        tenantId: user.tenantId, 
        name,
        OR: [
          { branchId },
          { branchId: null },
        ],
      },
    });

    if (existingYear) {
      console.log('Year already exists:', existingYear.id);
      return NextResponse.json({ error: 'An academic year with this name already exists' }, { status: 409 });
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
        branchId: branchId || null,
      },
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    return NextResponse.json({ error: error.message || 'Failed to create academic year' }, { status: 500 });
  }
}
