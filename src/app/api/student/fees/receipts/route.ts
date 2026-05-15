import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { userId: user.id },
          ...(user.role === 'PARENT'
            ? [{ parents: { some: { userId: user.id } } }]
            : []),
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const where: any = { studentId: student.id, tenantId: user.tenantId };
    if (academicYearId) where.academicYearId = academicYearId;

    const receipts = await prisma.feeReceipt.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
    });

    const academicYearIds = Array.from(new Set(receipts.map(r => r.academicYearId)));
    const termIds = Array.from(new Set(receipts.map(r => r.termId)));
    const academicYears = academicYearIds.length ? await prisma.academicYear.findMany({ where: { id: { in: academicYearIds } }, select: { id: true, name: true } }) : [];
    const terms = termIds.length ? await prisma.term.findMany({ where: { id: { in: termIds } }, select: { id: true, name: true } }) : [];
    const yearMap = new Map(academicYears.map(y => [y.id, y]));
    const termMap = new Map(terms.map(t => [t.id, t]));

    const receiptsWithRelations = receipts.map(r => ({
      ...r,
      academicYear: yearMap.get(r.academicYearId),
      term: termMap.get(r.termId),
    }));

    return NextResponse.json({ receipts: receiptsWithRelations });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}