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
      return NextResponse.json({ error: 'You do not have permission to transfer staff' }, { status: 403 });
    }

    const staffId = params.id;
    const body = await request.json();
    const { targetBranchId, reason } = body;

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Target branch ID is required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { branch: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const targetBranch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
    });

    if (!targetBranch || !targetBranch.isActive) {
      return NextResponse.json({ error: 'Target branch not found or inactive' }, { status: 400 });
    }

    if (staff.branchId === targetBranchId) {
      return NextResponse.json({ error: 'Staff is already in the target branch' }, { status: 400 });
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
          staffId: staff.id,
          status: { in: ['PENDING', 'PARTIAL'] },
        },
      });

      if (unpaidFees) {
        validationErrors.push('Staff has unpaid fees');
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Transfer validation failed',
        validationErrors,
      }, { status: 400 });
    }

    const previousBranchId = staff.branchId;
    const previousBranchName = staff.branch?.name || 'None';

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
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
        }),
      },
    });

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      transfer: {
        fromBranch: previousBranchName,
        toBranch: targetBranch.name,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Staff transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer staff' }, { status: 500 });
  }
}