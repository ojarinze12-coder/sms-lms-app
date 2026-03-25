import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const updatePolicySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  appliesTo: z.array(z.enum(['ALL_TENANTS', 'NEW_TENANTS', 'ENTERPRISE_ONLY', 'SPECIFIC_PLAN'])).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const policy = await prisma.globalPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Admin Policy GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePolicySchema.parse(body);

    const existingPolicy = await prisma.globalPolicy.findUnique({ where: { id } });
    if (!existingPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const policy = await prisma.globalPolicy.update({
      where: { id },
      data: validatedData,
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'POLICY_UPDATED',
        actionType: 'UPDATE',
        category: 'SECURITY',
        targetType: 'policy',
        targetId: policy.id,
        targetName: policy.name,
        description: `Updated global policy: ${policy.name}`,
        changes: validatedData,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Policy PUT error:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const policy = await prisma.globalPolicy.findUnique({ where: { id } });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    await prisma.globalPolicy.delete({ where: { id } });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'POLICY_DELETED',
        actionType: 'DELETE',
        category: 'SECURITY',
        targetType: 'policy',
        targetId: id,
        targetName: policy.name,
        description: `Deleted global policy: ${policy.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Policy DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}
