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
  classId: z.string().uuid('Invalid class ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  courseId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');

    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    if (authUser.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: authUser.userId },
        select: { classId: true },
      });
      const enrolledClassIds = enrollments.map(e => e.classId);
      where.AND = [
        { isPublished: true },
        { classId: { in: enrolledClassIds } },
      ];
    } else if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      where.academicClass = { tenantId: authUser.tenantId };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        academicClass: { select: { id: true, name: true, level: true, stream: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ classId: 'asc' }, { order: 'asc' }],
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

    const academicClass = await prisma.academicClass.findUnique({
      where: { id: validatedData.classId },
    });

    if (!academicClass || academicClass.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid class' }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject || subject.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const maxOrderLesson = await prisma.lesson.findFirst({
      where: { classId: validatedData.classId, subjectId: validatedData.subjectId },
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
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        courseId: validatedData.courseId,
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