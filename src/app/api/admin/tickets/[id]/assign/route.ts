import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function POST(
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
    const { assignedTo } = body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo,
        assignedAt: new Date(),
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Admin Ticket Assign error:', error);
    return NextResponse.json({ error: 'Failed to assign ticket' }, { status: 500 });
  }
}
