import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, getAuthUser } from '@/lib/auth-server';

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

const createTicketSchema = {
  subject: (val: any) => val && val.length >= 3,
  description: (val: any) => val && val.length >= 10,
  category: (val: any) => ['BILLING', 'TECHNICAL', 'ACADEMIC', 'ACCOUNT', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER'].includes(val),
  priority: (val: any) => ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(val),
  requesterType: (val: any) => ['TENANT_ADMIN', 'TENANT_USER', 'PARENT', 'STUDENT', 'PUBLIC'].includes(val),
  requesterId: (val: any) => val && val.length > 0,
  requesterEmail: (val: any) => val && val.includes('@'),
  requesterName: (val: any) => val && val.length > 0,
  tenantId: (val: any) => val && val.length > 0,
};

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;
    if (tenantId) where.tenantId = tenantId;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      tickets,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin Tickets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  const isSuperAdmin = await requireSuperAdmin();

  if (!authUser && !isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    for (const [key, validator] of Object.entries(createTicketSchema)) {
      if (!validator(body[key])) {
        return NextResponse.json(
          { error: `Invalid ${key}` },
          { status: 400 }
        );
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        subject: body.subject,
        description: body.description,
        category: body.category,
        priority: body.priority || 'MEDIUM',
        requesterType: body.requesterType,
        requesterId: body.requesterId,
        requesterEmail: body.requesterEmail,
        requesterName: body.requesterName,
        tenantId: body.tenantId,
        status: 'OPEN',
      },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: body.requesterType as any,
        senderId: body.requesterId,
        senderName: body.requesterName,
        senderEmail: body.requesterEmail,
        content: body.description,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Admin Tickets POST error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
