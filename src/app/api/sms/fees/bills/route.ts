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
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const where: any = { studentId, tenantId: user.tenantId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    const bills = await prisma.studentFeeBill.findMany({
      where,
      include: {
        billItems: true,
        student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
        term: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}