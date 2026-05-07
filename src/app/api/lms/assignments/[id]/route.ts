import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'PROJECT', 'QUIZ']).optional(),
  points: z.number().min(1).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  allowLate: z.boolean().optional(),
  latePenalty: z.number().nullable().optional(),
  allowFileUpload: z.boolean().optional(),
  maxFileSize: z.number().nullable().optional(),
  isPublished: z.boolean().optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        academicClass: { select: { id: true, name: true, level: true, stream: true } },
        subject: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const tenantId = assignment.academicClass?.tenantId || assignment.subject?.tenantId || assignment.course?.tenantId;
    if (tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Assignment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { academicClass: true, subject: true, course: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const tenantId = assignment.academicClass?.tenantId || assignment.subject?.tenantId || assignment.course?.tenantId;
    if (tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Assignment PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { academicClass: true, subject: true, course: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const tenantId = assignment.academicClass?.tenantId || assignment.subject?.tenantId || assignment.course?.tenantId;
    if (tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.assignment.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assignment DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}