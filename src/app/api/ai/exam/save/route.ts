import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const questionSchema = z.object({
  content: z.string().min(1),
  type: z.string().default('MULTIPLE_CHOICE'),
  points: z.number().default(1),
  options: z.array(z.object({
    content: z.string(),
    isCorrect: z.boolean(),
    order: z.number(),
  })),
});

const validExamTypes = ['MID_TERM', 'END_TERM', 'MOCK', 'WAEC', 'NECO', 'JAMB_UTME', 'BECE', 'ASSIGNMENT', 'QUIZ', 'PRACTICE'];

const saveExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  examType: z.string().refine(val => validExamTypes.includes(val), {
    message: 'Invalid exam type'
  }).default('MID_TERM'),
  duration: z.number().min(1).max(180).default(60),
  termId: z.string().uuid('Invalid term ID').optional().nullable(),
  subjectId: z.string().uuid('Invalid subject ID'),
  academicClassId: z.string().uuid('Invalid class ID').optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = saveExamSchema.parse(body);

    // Get subject to find tenant
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
      include: { academicClass: { include: { academicYear: true } } }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Create exam with questions in Prisma
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        examType: validatedData.examType,
        duration: validatedData.duration,
        termId: validatedData.termId,
        subjectId: validatedData.subjectId,
        createdById: authUser.userId,
        status: 'DRAFT',
        tenantId: subject.academicClass.academicYear.tenantId,
        questions: {
          create: validatedData.questions.map((q, index) => ({
            content: q.content,
            type: q.type,
            points: q.points,
            order: index + 1,
            options: {
              create: q.options.map((opt, optIndex) => ({
                content: opt.content,
                isCorrect: opt.isCorrect,
                order: optIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        },
        subject: true,
        term: true,
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Save AI Exam error:', error);
    return NextResponse.json({ error: 'Failed to save exam: ' + (error?.message || 'Unknown error') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('id');

    if (examId) {
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          tenantId: authUser.tenantId
        },
        include: {
          subject: true,
          term: true,
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' }
          },
        },
      });

      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }

      return NextResponse.json(exam);
    }

    const exams = await prisma.exam.findMany({
      where: {
        tenantId: authUser.tenantId
      },
      include: {
        subject: true,
        term: true,
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(exams);
  } catch (error: any) {
    console.error('Get AI Exams error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'Unknown') }, { status: 500 });
  }
}