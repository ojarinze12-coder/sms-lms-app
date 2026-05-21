import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { CreateFeeComponentSchema, UpdateFeeComponentSchema, BulkCreateFeeComponentsSchema } from '@/lib/schemas/fee';

async function validateFeeType(type: string, tenantId: string, branchId?: string | null): Promise<boolean> {
  const feeType = await prisma.feeType.findFirst({
    where: {
      tenantId,
      code: type,
      isActive: true,
      OR: [{ branchId: branchId || null }, { branchId: null }],
    },
  });
  return !!feeType;
}

async function getActiveFeeTypeCodes(tenantId: string): Promise<Set<string>> {
  const types = await prisma.feeType.findMany({
    where: { tenantId, isActive: true },
    select: { code: true },
  });
  return new Set(types.map(t => t.code));
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');
    const tierId = searchParams.get('tierId');
    const branchId = searchParams.get('branchId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const userBranchId = user?.branchId;
    const where: any = { tenantId: user.tenantId };
    if (userBranchId) where.branchId = userBranchId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;
    if (tierId) where.tierId = tierId;
    if (branchId) where.branchId = branchId;
    if (category) where.category = category;
    if (type) where.type = type;

    const components = await prisma.feeComponent.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const tierIds = Array.from(new Set(components.map(c => c.tierId).filter(Boolean) as string[]));
    const branchIds = Array.from(new Set(components.map(c => c.branchId).filter(Boolean) as string[]));
    const tiers = tierIds.length ? await prisma.tier.findMany({ where: { id: { in: tierIds } }, select: { id: true, name: true, code: true } }) : [];
    const branches = branchIds.length ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true, code: true } }) : [];
    const tierMap = new Map(tiers.map(t => [t.id, t]));
    const branchMap = new Map(branches.map(b => [b.id, b]));

    const componentsWithRelations = components.map(c => ({
      ...c,
      tier: c.tierId ? tierMap.get(c.tierId) : undefined,
      branch: c.branchId ? branchMap.get(c.branchId) : undefined,
    }));

    return NextResponse.json({ components: componentsWithRelations });
  } catch (error: any) {
    console.error('Error fetching fee components:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { bulk, ...rest } = body;

    if (bulk === true) {
      const parsed = BulkCreateFeeComponentsSchema.safeParse(rest);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      const { academicYearId, termId, branchId, tierId, components } = parsed.data;

      const validCodes = await getActiveFeeTypeCodes(user.tenantId);
      const invalidTypes = components.filter(c => !validCodes.has(c.type));
      if (invalidTypes.length > 0) {
        return NextResponse.json({
          error: `Invalid fee type(s): ${invalidTypes.map(c => c.type).join(', ')}`,
        }, { status: 400 });
      }

      const created = await prisma.$transaction(
        components.map((c) =>
          prisma.feeComponent.create({
            data: {
              name: c.name,
              type: c.type,
              category: c.category,
              amount: c.amount,
              description: c.description,
              isRecurring: c.isRecurring,
              academicYearId,
              termId: termId || undefined,
              branchId: branchId || undefined,
              tierId: tierId || undefined,
              tenantId: user.tenantId,
              dueDate: c.dueDate ? new Date(c.dueDate) : undefined,
            },
          })
        )
      );

      return NextResponse.json({ components: created, count: created.length }, { status: 201 });
    }

    const parsed = CreateFeeComponentSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const validType = await validateFeeType(data.type, user.tenantId, data.branchId);
    if (!validType) {
      return NextResponse.json({ error: `Invalid fee type: ${data.type}` }, { status: 400 });
    }

    const component = await prisma.feeComponent.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        isRecurring: data.isRecurring,
        academicYearId: data.academicYearId,
        termId: data.termId || undefined,
        branchId: data.branchId || undefined,
        tierId: data.tierId || undefined,
        tenantId: user.tenantId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    return NextResponse.json({ component }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating fee component:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}