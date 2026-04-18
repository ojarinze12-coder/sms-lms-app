import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasAdminRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'VICE_PRINCIPAL']);
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: {
        promotionEnabled: true,
        promotionRequireFeesPaid: true,
        promotionMinAttendance: true,
        promotionAutoEnroll: true,
      },
    });

    return NextResponse.json({
      promotionEnabled: settings?.promotionEnabled ?? true,
      promotionRequireFeesPaid: settings?.promotionRequireFeesPaid ?? true,
      promotionMinAttendance: settings?.promotionMinAttendance ?? 75.0,
      promotionAutoEnroll: settings?.promotionAutoEnroll ?? true,
    });
  } catch (error) {
    console.error('Promotion settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let authUser;
  try {
    authUser = await getAuthUser();
  } catch (e) {
    return NextResponse.json({ error: 'Auth error: ' + String(e) }, { status: 401 });
  }
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasAdminRole(authUser)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    console.log('PUT body:', body);
    
    const { promotionEnabled, promotionRequireFeesPaid, promotionMinAttendance, promotionAutoEnroll } = body;

    const promotionMinAttendanceVal = Number(promotionMinAttendance) || 75;

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: authUser.tenantId },
      update: {
        promotionEnabled: promotionEnabled ?? true,
        promotionRequireFeesPaid: promotionRequireFeesPaid ?? true,
        promotionMinAttendance: promotionMinAttendanceVal,
        promotionAutoEnroll: promotionAutoEnroll ?? true,
      },
      create: {
        tenantId: authUser.tenantId,
        promotionEnabled: promotionEnabled ?? true,
        promotionRequireFeesPaid: promotionRequireFeesPaid ?? true,
        promotionMinAttendance: promotionMinAttendanceVal,
        promotionAutoEnroll: promotionAutoEnroll ?? true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}