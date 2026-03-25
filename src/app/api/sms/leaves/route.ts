import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createLeaveSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  leaveType: z.enum(['SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'EXAM_DUTY', 'OTHER']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');

    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;

    const leaves = await prisma.staffLeave.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leaves || []);
  } catch (error) {
    console.error('Leave GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLeaveSchema.parse(body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.staffLeave.create({
      data: {
        teacherId: validatedData.teacherId,
        leaveType: validatedData.leaveType,
        startDate,
        endDate,
        days,
        reason: validatedData.reason,
        status: 'PENDING',
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Leave POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { leaveId, action, reason } = body;

    if (!leaveId || !action) {
      return NextResponse.json({ error: 'Leave ID and action required' }, { status: 400 });
    }

    const leave = await prisma.staffLeave.findUnique({ where: { id: leaveId } });
    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    let status = leave.status;
    if (action === 'approve') {
      status = 'APPROVED';
    } else if (action === 'reject') {
      status = 'REJECTED';
    } else if (action === 'cancel') {
      status = 'CANCELLED';
    }

    const updated = await prisma.staffLeave.update({
      where: { id: leaveId },
      data: {
        status,
        approvedBy: authUser.userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Leave PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
