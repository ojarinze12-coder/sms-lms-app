import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasTransferRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasTransferRole(authUser)) {
      return NextResponse.json({ error: 'You do not have permission to transfer teachers' }, { status: 403 });
    }

    const body = await request.json();
    const { teacherIds, targetBranchId, reason } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return NextResponse.json({ error: 'Teacher IDs array is required' }, { status: 400 });
    }

    const targetBranch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
    });

    if (!targetBranch || !targetBranch.isActive) {
      return NextResponse.json({ error: 'Target branch not found or inactive' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
    });

    if (!settings?.allowStaffTransfers) {
      return NextResponse.json({ error: 'Staff transfers are not allowed' }, { status: 400 });
    }

    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: teacherIds },
        tenantId: authUser.tenantId,
      },
      include: { branch: true },
    });

    if (teachers.length === 0) {
      return NextResponse.json({ error: 'No teachers found' }, { status: 404 });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { teacherId: string; error: string }[],
    };

    for (const teacher of teachers) {
      try {
        if (teacher.branchId === targetBranchId) {
          results.skipped++;
          results.errors.push({ teacherId: teacher.employeeId, error: 'Already in target branch' });
          continue;
        }

        const validationErrors: string[] = [];

        if (settings.requireFeesPaidForStaffTransfer) {
          const unpaidFees = await prisma.feePayment.findFirst({
            where: {
              teacherId: teacher.id,
              status: { in: ['PENDING', 'PARTIAL'] },
            },
          });

          if (unpaidFees) {
            validationErrors.push('Has unpaid fees');
          }
        }

        if (validationErrors.length > 0) {
          results.failed++;
          results.errors.push({ teacherId: teacher.employeeId, error: validationErrors.join(', ') });
          continue;
        }

        const previousBranchName = teacher.branch?.name || 'None';

        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { branchId: targetBranchId },
        });

        await prisma.auditLog.create({
          data: {
            tenantId: authUser.tenantId,
            userId: authUser.userId,
            action: 'TRANSFER',
            entity: 'TEACHER',
            entityId: teacher.id,
            details: JSON.stringify({
              employeeId: teacher.employeeId,
              teacherName: `${teacher.firstName} ${teacher.lastName}`,
              fromBranch: previousBranchName,
              toBranch: targetBranch.name,
              reason,
              bulk: true,
            }),
          },
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ teacherId: teacher.employeeId, error: err.message });
      }
    }

    return NextResponse.json({
      success: results.success > 0,
      results,
      transfer: {
        toBranch: targetBranch.name,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Bulk teacher transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer teachers' }, { status: 500 });
  }
}