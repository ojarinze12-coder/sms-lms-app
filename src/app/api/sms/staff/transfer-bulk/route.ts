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
      return NextResponse.json({ error: 'You do not have permission to transfer staff' }, { status: 403 });
    }

    const body = await request.json();
    const { staffIds, targetBranchId, reason } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json({ error: 'Staff IDs array is required' }, { status: 400 });
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

    const staffMembers = await prisma.staff.findMany({
      where: {
        id: { in: staffIds },
        tenantId: authUser.tenantId,
      },
      include: { branch: true },
    });

    if (staffMembers.length === 0) {
      return NextResponse.json({ error: 'No staff found' }, { status: 404 });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { staffId: string; error: string }[],
    };

    for (const staff of staffMembers) {
      try {
        if (staff.branchId === targetBranchId) {
          results.skipped++;
          results.errors.push({ staffId: staff.employeeId, error: 'Already in target branch' });
          continue;
        }

        const validationErrors: string[] = [];

        if (settings.requireFeesPaidForStaffTransfer) {
          const unpaidFees = await prisma.feePayment.findFirst({
            where: {
              staffId: staff.id,
              status: { in: ['PENDING', 'PARTIAL'] },
            },
          });

          if (unpaidFees) {
            validationErrors.push('Has unpaid fees');
          }
        }

        if (validationErrors.length > 0) {
          results.failed++;
          results.errors.push({ staffId: staff.employeeId, error: validationErrors.join(', ') });
          continue;
        }

        const previousBranchName = staff.branch?.name || 'None';

        await prisma.staff.update({
          where: { id: staff.id },
          data: { branchId: targetBranchId },
        });

        await prisma.auditLog.create({
          data: {
            tenantId: authUser.tenantId,
            userId: authUser.userId,
            action: 'TRANSFER',
            entity: 'STAFF',
            entityId: staff.id,
            details: JSON.stringify({
              employeeId: staff.employeeId,
              staffName: `${staff.firstName} ${staff.lastName}`,
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
        results.errors.push({ staffId: staff.employeeId, error: err.message });
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
    console.error('Bulk staff transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer staff' }, { status: 500 });
  }
}