import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  requiredFor: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  expiryMonths: z.number().optional(),
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

    const categories = await prisma.documentCategory.findMany({
      where: { tenantId },
      orderBy: { displayName: 'asc' },
      include: {
        _count: { select: { documents: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Document category GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const data = categorySchema.parse(body);

    const category = await prisma.documentCategory.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Document category POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}