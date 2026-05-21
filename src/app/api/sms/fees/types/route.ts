import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { z } from 'zod';

const DEFAULT_FEE_TYPES = [
  { code: 'TUITION', name: 'Tuition' },
  { code: 'REGISTRATION', name: 'Registration' },
  { code: 'EXAMINATION', name: 'Examination' },
  { code: 'TRANSPORT', name: 'Transport' },
  { code: 'HOSTEL', name: 'Hostel' },
  { code: 'LIBRARY', name: 'Library' },
  { code: 'LABORATORY', name: 'Laboratory' },
  { code: 'UNIFORM', name: 'Uniform' },
  { code: 'EXTRA_CURRICULAR', name: 'Extra Curricular' },
  { code: 'SPORTS', name: 'Sports' },
  { code: 'LEVY', name: 'Levy' },
  { code: 'BOOK', name: 'Book' },
  { code: 'PTA', name: 'PTA' },
  { code: 'NEWSLETTER', name: 'Newsletter' },
  { code: 'DEVELOPMENT', name: 'Development' },
  { code: 'OTHER', name: 'Other' },
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBranchId = user?.branchId;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    const whereBranchId = branchId || userBranchId;
    let types = await prisma.feeType.findMany({
      where: {
        tenantId: user.tenantId,
        ...(whereBranchId ? { OR: [{ branchId: whereBranchId }, { branchId: null }] } : {}),
        ...(isActive === 'true' ? { isActive: true } : {}),
      },
      orderBy: { name: 'asc' },
    });

    if (types.length === 0) {
      types = await prisma.feeType.createMany({
        data: DEFAULT_FEE_TYPES.map(ft => ({
          code: ft.code,
          name: ft.name,
          tenantId: user.tenantId,
        })),
      });

      types = await prisma.feeType.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ feeTypes: types });
  } catch (error: any) {
    console.error('Error fetching fee types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const CreateFeeTypeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).toUpperCase(),
  name: z.string().min(1, 'Name is required').max(100),
  branchId: z.string().uuid('Invalid branch ID').optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'BURSAR', 'FINANCE_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.tenantId) {
      return NextResponse.json({ error: 'Tenant not found. Please re-login.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = CreateFeeTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { code, name, branchId } = parsed.data;

    const existing = await prisma.feeType.findFirst({
      where: {
        tenantId: user.tenantId,
        code,
        ...(branchId ? { branchId } : { branchId: null }),
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Fee type with this code already exists' }, { status: 409 });
    }

    const feeType = await prisma.feeType.create({
      data: {
        code,
        name,
        tenantId: user.tenantId,
        branchId: branchId || null,
      },
    });

    return NextResponse.json({ feeType }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating fee type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}