import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate, isActive } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const existingYear = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existingYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    if (isActive && !existingYear.isActive) {
      await prisma.academicYear.updateMany({
        where: { tenantId: user.tenantId },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
      },
    });

    return NextResponse.json(academicYear);
  } catch (error: any) {
    console.error('Error updating academic year:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const existingYear = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existingYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    await prisma.academicYear.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Academic year deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
