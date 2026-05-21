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
    const status = searchParams.get('status');

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const userBranchId = user?.branchId;
    const where: any = { academicYearId, tenantId: user.tenantId };
    if (userBranchId) where.branchId = userBranchId;
    if (termId) where.termId = termId;
    if (tierId) where.tierId = tierId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const registrations = await prisma.studentFeeRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const studentIds = Array.from(new Set(registrations.map(r => r.studentId)));
    const students = studentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, studentId: true, firstName: true, lastName: true, branchId: true },
        })
      : [];
    const studentMap = new Map(students.map(s => [s.id, s]));

    const tierIds = Array.from(new Set(registrations.map(r => r.tierId).filter(Boolean) as string[]));
    const tiers = tierIds.length
      ? await prisma.tier.findMany({ where: { id: { in: tierIds } }, select: { id: true, name: true, code: true } })
      : [];
    const tierMap = new Map(tiers.map(t => [t.id, t]));

    const registrationIds = registrations.map(r => r.id);
    const allSelections = registrationIds.length
      ? await prisma.studentFeeComponentSelection.findMany({ where: { registrationId: { in: registrationIds } } })
      : [];
    const selectionsByRegistration = new Map<string, typeof allSelections>();
    for (const sel of allSelections) {
      if (!selectionsByRegistration.has(sel.registrationId)) selectionsByRegistration.set(sel.registrationId, []);
      selectionsByRegistration.get(sel.registrationId)!.push(sel);
    }

    const componentIds = Array.from(new Set(allSelections.map(s => s.componentId)));
    const components = componentIds.length
      ? await prisma.feeComponent.findMany({ where: { id: { in: componentIds } }, select: { id: true, name: true, amount: true } })
      : [];
    const componentMap = new Map(components.map(c => [c.id, c]));

    const studentIdsForBills = registrations.map(r => r.studentId);
    const academicYearIdsForBills = registrations.map(r => r.academicYearId);
    const termIdsForBills = registrations.map(r => r.termId);
    const allBills = await prisma.studentFeeBill.findMany({
      where: {
        studentId: { in: studentIdsForBills },
        academicYearId: { in: academicYearIdsForBills },
        termId: { in: termIdsForBills },
      },
      select: { id: true, studentId: true, academicYearId: true, termId: true, status: true, totalAmount: true, balance: true },
    });
    const billMap = new Map<string, typeof allBills[0]>();
    for (const bill of allBills) {
      const key = `${bill.studentId}-${bill.academicYearId}-${bill.termId}`;
      billMap.set(key, bill);
    }

    const registrationsWithRelations = registrations.map(r => {
      const student = studentMap.get(r.studentId);
      const tier = r.tierId ? tierMap.get(r.tierId) : undefined;
      const selections = selectionsByRegistration.get(r.id) || [];
      const feeBill = billMap.get(`${r.studentId}-${r.academicYearId}-${r.termId}`) || null;
      const selectionsWithComponents = selections.map(s => ({
        ...s,
        component: componentMap.get(s.componentId),
      }));
      return {
        ...r,
        student,
        tier,
        selections: selectionsWithComponents,
        feeBill,
      };
    });

    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length;
    const pending = registrations.filter((r) => r.status === 'PENDING').length;

    return NextResponse.json({ registrations: registrationsWithRelations, summary: { total, confirmed, pending } });
  } catch (error: any) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, academicYearId, termId, selections, status } = body;

    if (!studentId || !academicYearId) {
      return NextResponse.json({ error: 'studentId and academicYearId are required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const existingReg = await prisma.studentFeeRegistration.findFirst({
      where: { studentId, academicYearId, termId: termId || undefined },
    });

    let registration;
    if (existingReg) {
      await prisma.studentFeeComponentSelection.deleteMany({ where: { registrationId: existingReg.id } });
      registration = await prisma.studentFeeRegistration.update({
        where: { id: existingReg.id },
        data: { status: status || 'CONFIRMED' },
      });
    } else {
      registration = await prisma.studentFeeRegistration.create({
        data: {
          studentId,
          academicYearId,
          termId: termId || null,
          status: status || 'CONFIRMED',
          tenantId: user.tenantId,
          branchId: student.branchId,
        },
      });
    }

    if (selections && selections.length > 0) {
      await prisma.studentFeeComponentSelection.createMany({
        data: selections.map((s: any) => ({
          registrationId: registration.id,
          componentId: s.feeComponentId,
          selectedAt: new Date(),
        })),
      });
    }

    return NextResponse.json({ studentFeeRegistration: registration }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}