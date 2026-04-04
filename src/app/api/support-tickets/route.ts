import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['BILLING', 'TECHNICAL', 'ACADEMIC', 'ACCOUNT', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
});

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (authUser.role === 'SUPER_ADMIN') {
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
    } else {
      where.tenantId = authUser.tenantId;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Support Tickets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        requesterType: authUser.role === 'SUPER_ADMIN' ? 'PUBLIC' : 'TENANT_ADMIN',
        requesterId: authUser.userId,
        requesterEmail: authUser.email,
        requesterName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email,
        tenantId: authUser.tenantId || undefined,
        subject: validatedData.subject,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Support Tickets POST error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
