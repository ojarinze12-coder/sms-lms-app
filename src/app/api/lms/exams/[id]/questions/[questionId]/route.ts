import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  content: z.string().min(1).optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']).optional(),
  points: z.number().min(1).optional(),
  order: z.number().int().positive().optional(),
  options: z.array(z.object({
    id: z.string().uuid().optional(),
    content: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.number().int().positive(),
  })).optional(),
});

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: examId, questionId } = await params;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        tenantId: authUser.tenantId
      }
    });

    if (!exam || exam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only edit questions in draft exams' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateQuestionSchema.parse(body);

    // Update question
    await prisma.question.update({
      where: { id: questionId },
      data: {
        content: validatedData.content,
        type: validatedData.type,
        points: validatedData.points,
        order: validatedData.order,
      }
    });

    // Update options if provided
    if (validatedData.options) {
      // Delete existing options
      await prisma.option.deleteMany({
        where: { questionId }
      });

      // Create new options
      await prisma.option.createMany({
        data: validatedData.options.map((opt) => ({
          content: opt.content,
          isCorrect: opt.isCorrect,
          order: opt.order,
          questionId,
        }))
      });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true }
    });

    return NextResponse.json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Question PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: examId, questionId } = await params;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        tenantId: authUser.tenantId
      }
    });

    if (!exam || exam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete questions from draft exams' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
