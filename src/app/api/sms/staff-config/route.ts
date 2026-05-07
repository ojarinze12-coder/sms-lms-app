import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateConfigSchema = z.object({
  teacherPositions: z.array(z.string()).optional(),
  staffCategories: z.array(z.string()).optional(),
  staffDepartments: z.array(z.string()).optional(),
  staffPositions: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: {
        teacherPositions: true,
        staffCategories: true,
        staffDepartments: true,
        staffPositions: true,
      },
    });

    return NextResponse.json({
      teacherPositions: settings?.teacherPositions || [],
      staffCategories: settings?.staffCategories || [],
      staffDepartments: settings?.staffDepartments || [],
      staffPositions: settings?.staffPositions || [],
    });
  } catch (error) {
    console.error('Staff config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateConfigSchema.parse(body);

    const updated = await prisma.tenantSettings.update({
      where: { tenantId: authUser.tenantId },
      data: {
        teacherPositions: data.teacherPositions,
        staffCategories: data.staffCategories,
        staffDepartments: data.staffDepartments,
        staffPositions: data.staffPositions,
      },
    });

    return NextResponse.json({
      teacherPositions: updated.teacherPositions,
      staffCategories: updated.staffCategories,
      staffDepartments: updated.staffDepartments,
      staffPositions: updated.staffPositions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Staff config PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}