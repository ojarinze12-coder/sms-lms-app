import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await requireSuperAdmin();
    const isAuthenticated = !!user;

    let settings: any = null;
    let config: any = null;

    if (user?.tenantId) {
      settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: user.tenantId },
      });

      config = await prisma.tenantConfig.findUnique({
        where: { tenantId: user.tenantId },
      });
    }

    return NextResponse.json({
      settings: {
        platformName: config?.smtpFromName || 'Edunext',
        supportEmail: config?.smtpFromEmail || 'support@edunext.com',
        allowRegistration: settings?.allowParentRegistration ?? true,
        aiFeaturesEnabled: true,
        themeMode: settings?.themeMode || 'system',
        brandColor: config?.primaryColor || '#1a56db',
        logo: config?.logo || '',
      },
      isAuthenticated,
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json({ 
      settings: {
        platformName: 'Edunext',
        supportEmail: 'support@edunext.com',
        allowRegistration: true,
        aiFeaturesEnabled: true,
        themeMode: 'system',
        brandColor: '#1a56db',
        logo: '',
      },
      isAuthenticated: false,
      error: 'Using default settings' 
    }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    if (!user || !user.tenantId) {
      return NextResponse.json({ 
        error: 'Unauthorized - Super Admin access required',
        isAuthenticated: false 
      }, { status: 401 });
    }

    const body = await req.json();
    const { platformName, supportEmail, allowRegistration, aiFeaturesEnabled, themeMode, brandColor, logo } = body;

    await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {
        allowParentRegistration: allowRegistration,
        themeMode,
      },
      create: {
        tenantId: user.tenantId,
        allowParentRegistration: allowRegistration,
        themeMode,
      },
    });

    await prisma.tenantConfig.upsert({
      where: { tenantId: user.tenantId },
      update: {
        smtpFromName: platformName,
        smtpFromEmail: supportEmail,
        primaryColor: brandColor,
        logo: logo,
      },
      create: {
        tenantId: user.tenantId,
        smtpFromName: platformName,
        smtpFromEmail: supportEmail,
        primaryColor: brandColor,
        logo: logo,
      },
    });

    return NextResponse.json({ success: true, isAuthenticated: true });
  } catch (error) {
    console.error('Error saving platform settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
