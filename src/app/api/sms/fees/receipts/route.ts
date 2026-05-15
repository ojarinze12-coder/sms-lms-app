import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');
    const studentId = searchParams.get('studentId');

    const where: any = { tenantId: user.tenantId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;
    if (studentId) where.studentId = studentId;

    const receipts = await prisma.feeReceipt.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
    });

    const studentIds = Array.from(new Set(receipts.map(r => r.studentId)));
    const students = studentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, studentId: true, firstName: true, lastName: true },
        })
      : [];
    const studentMap = new Map(students.map(s => [s.id, s]));

    const termIds = Array.from(new Set(receipts.map(r => r.termId)));
    const terms = termIds.length
      ? await prisma.term.findMany({ where: { id: { in: termIds } }, select: { id: true, name: true } })
      : [];
    const termMap = new Map(terms.map(t => [t.id, t]));

    const receiptsWithStudents = receipts.map(r => ({
      ...r,
      student: studentMap.get(r.studentId),
      term: termMap.get(r.termId),
    }));

    const totalCollected = receipts.reduce((sum, r) => sum + r.totalPaid, 0);

    return NextResponse.json({ receipts: receiptsWithStudents, summary: { total: receipts.length, totalCollected } });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}