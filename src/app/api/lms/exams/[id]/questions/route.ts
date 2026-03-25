import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createQuestionSchema = z.object({
  content: z.string().min(1, 'Question content is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']).default('MULTIPLE_CHOICE'),
  points: z.number().min(1).default(1),
  order: z.number().int().positive(),
  options: z.array(z.object({
    content: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.number().int().positive(),
  })).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const questions = await prisma.question.findMany({
      where: { examId: id },
      include: { options: true },
      orderBy: { order: 'asc' }
    });

    // If student, hide correct answers
    if (authUser.role === 'STUDENT') {
      const sanitizedQuestions = questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
          id: o.id,
          content: o.content,
          order: o.order,
        })),
      }));
      return NextResponse.json(sanitizedQuestions);
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const exam = await prisma.exam.findFirst({
      where: {
        id,
        tenantId: authUser.tenantId
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only add questions to draft exams' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createQuestionSchema.parse(body);

    let options = validatedData.options;
    if (validatedData.type === 'TRUE_FALSE' && !options) {
      options = [
        { content: 'True', isCorrect: false, order: 1 },
        { content: 'False', isCorrect: false, order: 2 },
      ];
    }

    if (validatedData.type === 'SHORT_ANSWER') {
      options = [];
    }

    const question = await prisma.question.create({
      data: {
        content: validatedData.content,
        type: validatedData.type,
        points: validatedData.points,
        order: validatedData.order,
        examId: id,
        options: options && options.length > 0 && validatedData.type !== 'SHORT_ANSWER' ? {
          create: options.map((opt) => ({
            content: opt.content,
            isCorrect: opt.isCorrect,
            order: opt.order,
          }))
        } : undefined
      },
      include: { options: true }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Question POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
