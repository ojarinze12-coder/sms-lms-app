import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate, isCurrent } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const existingTerm = await prisma.term.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    if (isCurrent && !existingTerm.isCurrent) {
      await prisma.term.updateMany({
        where: { academicYearId: existingTerm.academicYearId },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.term.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
      },
    });

    return NextResponse.json(term);
  } catch (error: any) {
    console.error('Error updating term:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existingTerm = await prisma.term.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    await prisma.term.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Term deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting term:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
