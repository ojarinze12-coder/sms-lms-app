import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

const GRADING_SCALE_KEY = 'grading_scales';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;

    const tenantModule = await prisma.tenantModule.findFirst({
      where: { tenantId, moduleKey: GRADING_SCALE_KEY },
    });

    const config = tenantModule?.config as { scales?: any[] } || {};
    const scales = config.scales || [];

    return NextResponse.json({ scales });
  } catch (error) {
    console.error('Error fetching grading scales:', error);
    return NextResponse.json({ error: 'Failed to fetch grading scales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const body = await req.json();
    const { name, description, isDefault, grades } = body;

    if (!name || !grades?.length) {
      return NextResponse.json({ error: 'Name and grades are required' }, { status: 400 });
    }

    const tenantModule = await prisma.tenantModule.findFirst({
      where: { tenantId, moduleKey: GRADING_SCALE_KEY },
    });

    const existingConfig = (tenantModule?.config as { scales?: any[] }) || {};
    let scales = existingConfig.scales || [];

    const scaleIndex = scales.findIndex((s: any) => s.name === name);
    const newScale = { name, description, isDefault, grades };

    if (scaleIndex >= 0) {
      scales[scaleIndex] = newScale;
    } else {
      scales.push(newScale);
    }

    if (isDefault) {
      scales = scales.map((s: any) => ({
        ...s,
        isDefault: s.name === name,
      }));
    }

    const config = { scales };

    if (tenantModule) {
      await prisma.tenantModule.update({
        where: { id: tenantModule.id },
        data: { config },
      });
    } else {
      await prisma.tenantModule.create({
        data: {
          tenantId,
          moduleKey: GRADING_SCALE_KEY,
          name: 'Grading Scales',
          description: 'Grading scale configuration',
          enabled: true,
          config,
        },
      });
    }

    return NextResponse.json({ success: true, scales });
  } catch (error) {
    console.error('Error saving grading scale:', error);
    return NextResponse.json({ error: 'Failed to save grading scale' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const { searchParams } = new URL(req.url);
    const scaleName = searchParams.get('name');

    if (!scaleName) {
      return NextResponse.json({ error: 'Scale name required' }, { status: 400 });
    }

    const tenantModule = await prisma.tenantModule.findFirst({
      where: { tenantId, moduleKey: GRADING_SCALE_KEY },
    });

    if (!tenantModule) {
      return NextResponse.json({ error: 'No grading scales found' }, { status: 404 });
    }

    const existingConfig = (tenantModule.config as { scales?: any[] }) || {};
    const scales = (existingConfig.scales || []).filter((s: any) => s.name !== scaleName);

    await prisma.tenantModule.update({
      where: { id: tenantModule.id },
      data: { config: { scales } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grading scale:', error);
    return NextResponse.json({ error: 'Failed to delete grading scale' }, { status: 500 });
  }
}
