import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const hostelSettingsSchema = z.object({
  hostelEnabled: z.boolean().optional(),
  hostelTypesAllowed: z.array(z.string()).optional(),
  hostelDefaultRoomType: z.string().optional(),
  hostelDefaultCapacity: z.number().optional(),
  hostelAutoAssign: z.boolean().optional(),
  hostelRequireApproval: z.boolean().optional(),
  hostelChargeFee: z.boolean().optional(),
  hostelCheckInOut: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return NextResponse.json({
      hostelEnabled: settings?.hostelEnabled ?? false,
      hostelTypesAllowed: settings?.hostelTypesAllowed ?? ['MALE', 'FEMALE'],
      hostelDefaultRoomType: settings?.hostelDefaultRoomType ?? 'DORMITORY',
      hostelDefaultCapacity: settings?.hostelDefaultCapacity ?? 4,
      hostelAutoAssign: settings?.hostelAutoAssign ?? true,
      hostelRequireApproval: settings?.hostelRequireApproval ?? false,
      hostelChargeFee: settings?.hostelChargeFee ?? false,
      hostelCheckInOut: settings?.hostelCheckInOut ?? true,
    });
  } catch (error) {
    console.error('Hostel settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const data = hostelSettingsSchema.parse(body);

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        hostelEnabled: settings.hostelEnabled,
        hostelTypesAllowed: settings.hostelTypesAllowed,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Hostel settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}