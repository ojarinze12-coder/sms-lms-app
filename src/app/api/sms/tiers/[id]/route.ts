import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UpdateTierSchema } from '@/lib/schemas/tier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await prisma.tier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
        tierCurriculum: true,
      },
    });

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (tier.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: tier });
  } catch (error) {
    console.error('Error fetching tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTier = await prisma.tier.findUnique({ where: { id } });
    
    if (!existingTier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (existingTier.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = UpdateTierSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tier data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const tier = await prisma.tier.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ data: tier });
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTier = await prisma.tier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { classes: true },
        },
      },
    });
    
    if (!existingTier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (existingTier.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if tier has classes
    if (existingTier._count.classes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tier with existing classes. Remove or reassign classes first.' },
        { status: 400 }
      );
    }

    // Delete tier curriculum first
    await prisma.tierCurriculum.deleteMany({ where: { tierId: id } });
    
    // Delete tier
    await prisma.tier.delete({ where: { id } });

    return NextResponse.json({ message: 'Tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
