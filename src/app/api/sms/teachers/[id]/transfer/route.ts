import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasTransferRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasTransferRole(authUser)) {
      return NextResponse.json({ error: 'You do not have permission to transfer teachers' }, { status: 403 });
    }

    const teacherId = params.id;
    const body = await request.json();
    const { targetBranchId, reason } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { branch: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const targetBranch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
    });

    if (!targetBranch || !targetBranch.isActive) {
      return NextResponse.json({ error: 'Target branch not found or inactive' }, { status: 400 });
    }

    if (teacher.branchId === targetBranchId) {
      return NextResponse.json({ error: 'Teacher is already in the target branch' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
    });

    if (!settings?.allowStaffTransfers) {
      return NextResponse.json({ error: 'Staff transfers are not allowed' }, { status: 400 });
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
        validationErrors.push('Teacher has unpaid fees');
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Transfer validation failed',
        validationErrors,
      }, { status: 400 });
    }

    const previousBranchId = teacher.branchId;
    const previousBranchName = teacher.branch?.name || 'None';

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
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
        }),
      },
    });

    return NextResponse.json({
      success: true,
      teacher: updatedTeacher,
      transfer: {
        fromBranch: previousBranchName,
        toBranch: targetBranch.name,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Teacher transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer teacher' }, { status: 500 });
  }
}