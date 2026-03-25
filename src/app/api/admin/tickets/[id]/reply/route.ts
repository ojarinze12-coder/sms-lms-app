import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const replySchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  const isSuperAdmin = await requireSuperAdmin();

  if (!authUser && !isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { content, isInternal } = replySchema.parse(body);

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const senderType = isSuperAdmin ? 'ADMIN' : 'USER';

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderType,
        senderId: isSuperAdmin ? (authUser?.userId || 'unknown') : ticket.requesterId,
        senderName: isSuperAdmin ? (authUser?.firstName + ' ' + authUser?.lastName) : ticket.requesterName,
        senderEmail: isSuperAdmin ? (authUser?.email || '') : ticket.requesterEmail,
        content,
        isInternal: isInternal || false,
      },
    });

    const status = isInternal ? ticket.status : (ticket.status === 'PENDING_REPLY' ? 'IN_PROGRESS' : ticket.status);
    
    await prisma.supportTicket.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Ticket Reply error:', error);
    return NextResponse.json({ error: 'Failed to reply to ticket' }, { status: 500 });
  }
}
