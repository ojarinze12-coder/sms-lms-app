import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: {
        badgesEnabled: true,
        badgesAutoAward: true,
        badgesShowOnReport: true,
      },
    });

    return NextResponse.json({
      badgesEnabled: settings?.badgesEnabled ?? true,
      badgesAutoAward: settings?.badgesAutoAward ?? false,
      badgesShowOnReport: settings?.badgesShowOnReport ?? true,
    });
  } catch (error: any) {
    console.error('Error fetching badge settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { badgesEnabled, badgesAutoAward, badgesShowOnReport } = body;

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: authUser.tenantId },
      update: {
        ...(badgesEnabled !== undefined && { badgesEnabled }),
        ...(badgesAutoAward !== undefined && { badgesAutoAward }),
        ...(badgesShowOnReport !== undefined && { badgesShowOnReport }),
      },
      create: {
        tenantId: authUser.tenantId,
        badgesEnabled: badgesEnabled ?? true,
        badgesAutoAward: badgesAutoAward ?? false,
        badgesShowOnReport: badgesShowOnReport ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating badge settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
