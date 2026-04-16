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
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    const where: any = {};

    if (academicYearId) {
      where.academicYearId = academicYearId;
    } else {
      where.academicYear = {
        tenantId: user.tenantId,
      };
    }

    if (branchId) {
      where.academicYear = {
        ...where.academicYear,
        OR: [
          { branchId },
          { branchId: null },
        ],
      };
    }

    const terms = await prisma.term.findMany({
      where,
      include: {
        academicYear: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json(terms);
  } catch (error: any) {
    console.error('Error fetching terms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, isCurrent, academicYearId } = body;

    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json(
        { error: 'Name, startDate, endDate, and academicYearId are required' },
        { status: 400 }
      );
    }

    if (isCurrent) {
      await prisma.term.updateMany({
        where: { academicYearId },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
        academicYearId,
      },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error: any) {
    console.error('Error creating term:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
