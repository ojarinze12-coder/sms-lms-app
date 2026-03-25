import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        daysPerWeek: true,
        periodDuration: true,
      },
    });

    return NextResponse.json({
      daysPerWeek: settings?.daysPerWeek || 5,
      periodDuration: settings?.periodDuration || 40,
    });
  } catch (error) {
    console.error('Error fetching timetable settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
