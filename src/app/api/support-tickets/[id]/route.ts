import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_REPLY', 'RESOLVED', 'CLOSED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  resolution: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
});

const addMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && ticket.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Support Ticket GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && ticket.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTicketSchema.parse(body);

    const updateData: any = { ...validatedData };

    if (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    if (validatedData.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    if (validatedData.assignedTo) {
      updateData.assignedAt = new Date();
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Support Ticket PUT error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && ticket.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = addMessageSchema.parse(body);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderType: authUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'USER',
        senderId: authUser.userId,
        senderName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email,
        senderEmail: authUser.email,
        content: validatedData.content,
      },
    });

    if (authUser.role !== 'SUPER_ADMIN') {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'PENDING_REPLY' },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Support Ticket PATCH error:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
