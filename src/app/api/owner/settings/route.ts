import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant settings for the group (SUPER_ADMIN's tenant)
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
      select: {
        aiEnabled: true,
        openRouterApiKey: true,
        openRouterModel: true,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching owner settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Upsert tenant settings
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {
        aiEnabled: body.aiEnabled ?? false,
        openRouterApiKey: body.openRouterApiKey,
        openRouterModel: body.openRouterModel,
      },
      create: {
        tenantId: user.tenantId,
        aiEnabled: body.aiEnabled ?? false,
        openRouterApiKey: body.openRouterApiKey,
        openRouterModel: body.openRouterModel,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error saving owner settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}