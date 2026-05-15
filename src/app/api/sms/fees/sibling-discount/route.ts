import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { UpdateSiblingDiscountSchema } from '@/lib/schemas/fee';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const where: any = { tenantId: user.tenantId };
    if (academicYearId) where.academicYearId = academicYearId;

    const siblingDiscounts = await prisma.siblingDiscount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (siblingDiscounts.length) {
      const yearIds = Array.from(new Set(siblingDiscounts.map(s => s.academicYearId).filter(Boolean) as string[]));
      const years = yearIds.length
        ? await prisma.academicYear.findMany({ where: { id: { in: yearIds } }, select: { id: true, name: true } })
        : [];
      const yearMap = new Map(years.map(y => [y.id, y]));
      const withYears = siblingDiscounts.map(s => ({
        ...s,
        academicYear: s.academicYearId ? yearMap.get(s.academicYearId) : undefined,
      }));
      return NextResponse.json({ siblingDiscounts: withYears });
    }

    return NextResponse.json({ siblingDiscounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { academicYearId } = body;

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const existing = await prisma.siblingDiscount.findUnique({
      where: { tenantId_academicYearId: { tenantId: user.tenantId, academicYearId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Sibling discount config already exists for this academic year. Use PUT to update.' }, { status: 409 });
    }

    const config = await prisma.siblingDiscount.create({
      data: {
        tenantId: user.tenantId,
        academicYearId,
        isEnabled: false,
        isActive: true,
        linkingMode: 'ADMIN_APPROVAL',
        secondChildDiscount: 0,
        thirdChildDiscount: 0,
        fourthChildDiscount: 0,
        fifthChildDiscount: 0,
        maxDiscountPerChild: 50,
        applyTo: 'ALL',
      },
    });

    return NextResponse.json({ siblingDiscount: config }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { academicYearId } = body;

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const existing = await prisma.siblingDiscount.findUnique({
      where: { tenantId_academicYearId: { tenantId: user.tenantId, academicYearId } },
    });

    const parsed = UpdateSiblingDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    let config;
    if (existing) {
      config = await prisma.siblingDiscount.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          linkingMode: parsed.data.linkingMode as any,
        },
      });
    } else {
      config = await prisma.siblingDiscount.create({
        data: {
          tenantId: user.tenantId,
          academicYearId,
          isEnabled: parsed.data.isEnabled ?? false,
          isActive: true,
          linkingMode: (parsed.data.linkingMode || 'ADMIN_APPROVAL') as any,
          secondChildDiscount: parsed.data.secondChildDiscount ?? 0,
          thirdChildDiscount: parsed.data.thirdChildDiscount ?? 0,
          fourthChildDiscount: parsed.data.fourthChildDiscount ?? 0,
          fifthChildDiscount: parsed.data.fifthChildDiscount ?? 0,
          maxDiscountPerChild: parsed.data.maxDiscountPerChild ?? 50,
          applyTo: parsed.data.applyTo ?? 'ALL',
        },
      });
    }

    return NextResponse.json({ siblingDiscount: config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}