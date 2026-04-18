import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasTransferRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SUPER_ADMIN']);
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
      return NextResponse.json({ error: 'You do not have permission to transfer students' }, { status: 403 });
    }

    const studentId = params.id;
    const body = await request.json();
    const { targetBranchId, reason } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { branch: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const targetBranch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
    });

    if (!targetBranch || !targetBranch.isActive) {
      return NextResponse.json({ error: 'Target branch not found or inactive' }, { status: 400 });
    }

    if (student.branchId === targetBranchId) {
      return NextResponse.json({ error: 'Student is already in the target branch' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
    });

    if (!settings?.allowStudentTransfers) {
      return NextResponse.json({ error: 'Student transfers are not allowed' }, { status: 400 });
    }

    const validationErrors: string[] = [];

    if (settings.requireActiveEnrollmentForTransfer) {
      const currentYear = await prisma.academicYear.findFirst({
        where: {
          tenantId: authUser.tenantId,
          isActive: true,
        },
      });

      if (currentYear) {
        const activeEnrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: student.id,
            academicYearId: currentYear.id,
            status: 'ACTIVE',
          },
        });

        if (activeEnrollment) {
          validationErrors.push('Student has active enrollment in current academic year');
        }
      }
    }

    if (settings.requireFeesPaidForTransfer) {
      const unpaidFees = await prisma.feePayment.findFirst({
        where: {
          studentId: student.id,
          status: { in: ['PENDING', 'PARTIAL'] },
        },
      });

      if (unpaidFees) {
        validationErrors.push('Student has unpaid fees');
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Transfer validation failed',
        validationErrors,
      }, { status: 400 });
    }

    const previousBranchId = student.branchId;
    const previousBranchName = student.branch?.name || 'None';

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { branchId: targetBranchId },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: authUser.tenantId,
        userId: authUser.userId,
        action: 'TRANSFER',
        entity: 'STUDENT',
        entityId: student.id,
        details: JSON.stringify({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          fromBranch: previousBranchName,
          toBranch: targetBranch.name,
          reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      transfer: {
        fromBranch: previousBranchName,
        toBranch: targetBranch.name,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Student transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer student' }, { status: 500 });
  }
}