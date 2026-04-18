import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasTransferRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SUPER_ADMIN']);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasTransferRole(authUser)) {
      return NextResponse.json({ error: 'You do not have permission to transfer students' }, { status: 403 });
    }

    const body = await request.json();
    const { studentIds, targetBranchId, reason, classId, status } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
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

    if (!settings?.allowStudentTransfers) {
      return NextResponse.json({ error: 'Student transfers are not allowed' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        tenantId: authUser.tenantId,
      },
      include: { branch: true },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found' }, { status: 404 });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { studentId: string; error: string }[],
    };

    for (const student of students) {
      try {
        if (student.branchId === targetBranchId) {
          results.skipped++;
          results.errors.push({ studentId: student.studentId, error: 'Already in target branch' });
          continue;
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
              validationErrors.push('Has active enrollment');
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
            validationErrors.push('Has unpaid fees');
          }
        }

        if (validationErrors.length > 0) {
          results.failed++;
          results.errors.push({ studentId: student.studentId, error: validationErrors.join(', ') });
          continue;
        }

        const previousBranchName = student.branch?.name || 'None';

        await prisma.student.update({
          where: { id: student.id },
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
              bulk: true,
            }),
          },
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ studentId: student.studentId, error: err.message });
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
    console.error('Bulk student transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer students' }, { status: 500 });
  }
}