import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { ApplyStudentDiscountSchema, ApproveRejectDiscountSchema } from '@/lib/schemas/fee';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');

    const userBranchId = user?.branchId;
    const where: any = { tenantId: user.tenantId };
    if (userBranchId) where.branchId = userBranchId;
    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;

    const discounts = await prisma.studentDiscount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const discountTypeIds = Array.from(new Set(discounts.map(d => d.discountTypeId)));
    const discountTypes = discountTypeIds.length
      ? await prisma.discountType.findMany({ where: { id: { in: discountTypeIds } } })
      : [];
    const discountTypeMap = new Map(discountTypes.map(dt => [dt.id, dt]));

    const studentIds = Array.from(new Set(discounts.map(d => d.studentId)));
    const students = studentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, studentId: true, firstName: true, lastName: true },
        })
      : [];
    const studentMap = new Map(students.map(s => [s.id, s]));

    const discountsWithRelations = discounts.map(d => ({
      ...d,
      student: studentMap.get(d.studentId),
      discountType: discountTypeMap.get(d.discountTypeId),
    }));

    return NextResponse.json({ discounts: discountsWithRelations });
  } catch (error: any) {
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
    const { action } = body;

    if (action === 'apply') {
      return applyDiscount(user, body);
    }
    if (action === 'approve-reject') {
      return approveRejectDiscount(user, body);
    }
    if (action === 'bulk-apply') {
      return bulkApplyDiscount(user, body);
    }

    return NextResponse.json({ error: 'Invalid action. Use apply, approve-reject, or bulk-apply.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function applyDiscount(user: any, body: any) {
  const parsed = ApplyStudentDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { studentId, discountTypeId, discountPercentage, reason, academicYearId, branchId } = parsed.data;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId: user.tenantId },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const discountType = await prisma.discountType.findFirst({
    where: { id: discountTypeId, tenantId: user.tenantId, isActive: true },
  });
  if (!discountType) return NextResponse.json({ error: 'Discount type not found or inactive' }, { status: 404 });

  const effectivePercentage = discountPercentage ?? discountType.discountPercentage;

  const existing = await prisma.studentDiscount.findUnique({
    where: { studentId_discountTypeId_academicYearId: { studentId, discountTypeId, academicYearId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Student already has this discount type for this academic year' }, { status: 409 });
  }

  const status = discountType.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

  const studentDiscount = await prisma.studentDiscount.create({
    data: {
      studentId,
      discountTypeId,
      discountPercentage: effectivePercentage,
      reason,
      status,
      academicYearId,
      tenantId: user.tenantId,
      branchId: branchId || student.branchId || null,
      approvedBy: status === 'APPROVED' ? user.id : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    },
  });

  return NextResponse.json({ studentDiscount, status }, { status: 201 });
}

async function approveRejectDiscount(user: any, body: any) {
  const parsed = ApproveRejectDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { studentDiscountId, approvalAction } = parsed.data;

    const userBranchId = user?.branchId;

    const studentDiscount = await prisma.studentDiscount.findFirst({
      where: { id: studentDiscountId, tenantId: user.tenantId, ...(userBranchId ? { branchId: userBranchId } : {}) },
    });
    if (!studentDiscount) return NextResponse.json({ error: 'Student discount not found' }, { status: 404 });

    if (studentDiscount.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'This discount is not pending approval' }, { status: 400 });
    }

  const updated = await prisma.studentDiscount.update({
    where: { id: studentDiscountId },
    data: {
      status: approvalAction === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedBy: user.id,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ studentDiscount: updated, message: approvalAction === 'approve' ? 'Discount approved' : 'Discount rejected' });
}

async function bulkApplyDiscount(user: any, body: any) {
  const { discountTypeId, studentIds, discountPercentage, reason, academicYearId } = body;

  if (!discountTypeId || !studentIds?.length || !academicYearId) {
    return NextResponse.json({ error: 'discountTypeId, studentIds, and academicYearId are required' }, { status: 400 });
  }

  const discountType = await prisma.discountType.findFirst({
    where: { id: discountTypeId, tenantId: user.tenantId, isActive: true },
  });
  if (!discountType) return NextResponse.json({ error: 'Discount type not found' }, { status: 404 });

  const effectivePercentage = discountPercentage ?? discountType.discountPercentage;
  const status = discountType.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

  const results = { applied: 0, skipped: 0, errors: [] as string[] };

  for (const studentId of studentIds) {
    try {
      const existing = await prisma.studentDiscount.findUnique({
        where: { studentId_discountTypeId_academicYearId: { studentId, discountTypeId, academicYearId } },
      });
      if (existing) { results.skipped++; continue; }

      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId: user.tenantId },
      });
      if (!student) { results.errors.push(`Student ${studentId} not found`); continue; }

      await prisma.studentDiscount.create({
        data: {
          studentId,
          discountTypeId,
          discountPercentage: effectivePercentage,
          reason,
          status,
          academicYearId,
          tenantId: user.tenantId,
          branchId: student.branchId || null,
          approvedBy: status === 'APPROVED' ? user.id : null,
          approvedAt: status === 'APPROVED' ? new Date() : null,
        },
      });
      results.applied++;
    } catch (e: any) {
      results.errors.push(`Error for student ${studentId}: ${e.message}`);
    }
  }

  return NextResponse.json(results, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const userBranchId = user?.branchId;
    const whereClause: any = { id, tenantId: user.tenantId };
    if (userBranchId) whereClause.branchId = userBranchId;

    await prisma.studentDiscount.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({ message: 'Student discount removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}