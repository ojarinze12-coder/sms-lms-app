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
      select: { name: true },
    });

    const config = await prisma.tenantConfig.findUnique({
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
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const body = await req.json();
    const { schoolName, email, phone, address, timezone, dateFormat, gradingScale, currency } = body;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: schoolName },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
