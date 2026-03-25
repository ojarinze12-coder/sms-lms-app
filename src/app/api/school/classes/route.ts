import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    // AcademicClass links to AcademicYear which has tenantId
    const classes = await prisma.academicClass.findMany({
      where: {
        academicYear: { tenantId }
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, level: true },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
