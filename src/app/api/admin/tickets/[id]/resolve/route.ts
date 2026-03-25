import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const resolveSchema = z.object({
  resolution: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

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
    const { resolution, rating, feedback } = resolveSchema.parse(body);

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution,
        rating,
        feedback,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Ticket Resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve ticket' }, { status: 500 });
  }
}
