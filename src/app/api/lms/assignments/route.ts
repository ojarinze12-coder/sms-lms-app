import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'PROJECT', 'QUIZ']).default('INDIVIDUAL'),
  points: z.number().min(1).default(100),
  dueDate: z.string().datetime().optional(),
  allowLate: z.boolean().default(true),
  latePenalty: z.number().optional(),
  allowFileUpload: z.boolean().default(true),
  maxFileSize: z.number().optional(),
  courseId: z.string().uuid('Invalid course ID'),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const classId = searchParams.get('classId');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (classId) where.classId = classId;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(assignments || []);
  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createAssignmentSchema.parse(body);

    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course || course.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        type: validatedData.type,
        points: validatedData.points,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        allowLate: validatedData.allowLate,
        latePenalty: validatedData.latePenalty,
        allowFileUpload: validatedData.allowFileUpload,
        maxFileSize: validatedData.maxFileSize,
        courseId: validatedData.courseId,
        subjectId: validatedData.subjectId,
        classId: validatedData.classId,
        createdById: authUser.userId,
        isPublished: false,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Assignment POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
