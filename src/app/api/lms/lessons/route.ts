import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any().optional(),
  type: z.enum(['VIDEO', 'DOCUMENT', 'ARTICLE', 'QUIZ', 'INTERACTIVE', 'ASSIGNMENT']).default('ARTICLE'),
  duration: z.number().optional(),
  order: z.number().default(0),
  isFree: z.boolean().default(false),
  courseId: z.string().uuid('Invalid course ID'),
  subjectId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      where.course = { tenantId: authUser.tenantId };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(lessons || []);
  } catch (error) {
    console.error('Lessons GET error:', error);
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
    const validatedData = createLessonSchema.parse(body);

    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course || course.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
    }

    const maxOrderLesson = await prisma.lesson.findFirst({
      where: { courseId: validatedData.courseId },
      orderBy: { order: 'desc' },
    });

    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        content: validatedData.content || {},
        type: validatedData.type,
        duration: validatedData.duration,
        order: validatedData.order || (maxOrderLesson?.order || 0) + 1,
        isFree: validatedData.isFree,
        courseId: validatedData.courseId,
        subjectId: validatedData.subjectId,
        createdById: authUser.userId,
        isPublished: false,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Lesson POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
