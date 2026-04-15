import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, brandColor: true, logo: true },
    });

    const config = await prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return NextResponse.json({
      settings: {
        schoolName: tenant?.name || '',
        email: config?.smtpFromEmail || '',
        phone: '',
        address: '',
        timezone: config?.timezone || 'Africa/Lagos',
        dateFormat: config?.dateFormat || 'DD/MM/YYYY',
        gradingScale: 'nigerian',
        currency: config?.currency || 'NGN',
        brandColor: tenant?.brandColor || '#1a56db',
        logo: tenant?.logo || '',
        themeMode: settings?.themeMode || 'SYSTEM',
        aiEnabled: settings?.aiEnabled || false,
        openRouterModel: settings?.openRouterModel || 'qwen/qwen3-coder:free',
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    console.log('[School Settings PUT] authUser:', authUser);
    
    if (!authUser) {
      console.log('[School Settings PUT] No auth user found');
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }
    
    if (!authUser.tenantId) {
      console.log('[School Settings PUT] No tenantId for user:', authUser.userId);
      return NextResponse.json({ error: 'Unauthorized - No school associated with account' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    console.log('[School Settings PUT] Saving for tenant:', tenantId);
    
    const body = await req.json();
    const { schoolName, email, phone, address, timezone, dateFormat, gradingScale, currency, brandColor, logo, themeMode, aiEnabled, openRouterApiKey, openRouterModel } = body;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: schoolName, brandColor, logo },
    });

    await prisma.tenantConfig.upsert({
      where: { tenantId },
      update: {
        smtpFromEmail: email,
        timezone,
        dateFormat,
        currency,
      },
      create: {
        tenantId,
        smtpFromEmail: email,
        timezone,
        dateFormat,
        currency,
      },
    });

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        themeMode,
        aiEnabled,
        openRouterApiKey,
        openRouterModel,
      },
      create: {
        tenantId,
        themeMode,
        aiEnabled,
        openRouterApiKey,
        openRouterModel,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
