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
    const tierId = searchParams.get('tierId');
    const branchId = searchParams.get('branchId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const where: any = { academicYearId, tenantId: user.tenantId };
    if (termId) where.termId = termId;
    if (branchId) where.branchId = branchId;
    else if (user.branchId) where.branchId = user.branchId;

    const bills = await prisma.studentFeeBill.findMany({ where, orderBy: { createdAt: 'desc' } });

    const studentIds = Array.from(new Set(bills.map(b => b.studentId)));
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, studentId: true, firstName: true, lastName: true, branchId: true },
    });
    const studentMap = new Map(students.map(s => [s.id, s]));

    const billIds = bills.map(b => b.id);
    const allBillItems = billIds.length
      ? await prisma.feeBillItem.findMany({ where: { billId: { in: billIds } } })
      : [];
    const itemsByBill = new Map<string, typeof allBillItems>();
    for (const item of allBillItems) {
      if (!itemsByBill.has(item.billId)) itemsByBill.set(item.billId, []);
      itemsByBill.get(item.billId)!.push(item);
    }

    const terms = await prisma.term.findMany({
      where: { academicYearId },
      select: { id: true, name: true },
    });
    const termMap = new Map(terms.map(t => [t.id, t.name]));

    let report = bills.map((bill) => {
      const items = (itemsByBill.get(bill.id) || []).map((item) => ({
        id: item.id,
        componentName: item.componentName,
        amountDue: item.amountDue,
        amountPaid: item.amountPaid,
        outstanding: item.outstanding,
        status: item.status,
      }));

      return {
        studentId: bill.studentId,
        studentStudentId: studentMap.get(bill.studentId)?.studentId || '',
        studentName: `${studentMap.get(bill.studentId)?.firstName || ''} ${studentMap.get(bill.studentId)?.lastName || ''}`,
        branchId: studentMap.get(bill.studentId)?.branchId || bill.branchId,
        termId: bill.termId,
        termName: termMap.get(bill.termId) || 'N/A',
        billId: bill.id,
        status: bill.status,
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        items,
      };
    });

    if (tierId) {
      const studentsInTier = await prisma.student.findMany({
        where: { tenantId: user.tenantId },
        include: { enrollments: { where: { academicClass: { tierId, academicYearId } }, take: 1 } },
      });
      const tierStudentIds = new Set(studentsInTier.map((s) => s.id));
      report = report.filter((r) => tierStudentIds.has(r.studentId));
    }

    const summary = {
      totalStudents: report.length,
      fullyPaid: report.filter((r) => r.status === 'FULLY_PAID').length,
      partiallyPaid: report.filter((r) => r.status === 'PARTIALLY_PAID').length,
      unpaid: report.filter((r) => r.status === 'UNPAID').length,
      totalBilled: report.reduce((sum, r) => sum + r.totalAmount, 0),
      totalCollected: report.reduce((sum, r) => sum + r.amountPaid, 0),
      totalOutstanding: report.reduce((sum, r) => sum + r.balance, 0),
    };

    return NextResponse.json({ balanceReport: report, summary });
  } catch (error: any) {
    console.error('Error generating balance report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}