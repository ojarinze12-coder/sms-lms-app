import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textAnswer: z.string().optional(),
});

const submitExamSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit exams' }, { status: 403 });
    }

    const { id: examId } = await params;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        tenantId: authUser.tenantId
      },
      include: {
        questions: { select: { id: true, type: true, points: true } }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Exam is not available' }, { status: 400 });
    }

    const now = new Date();
    if (exam.startTime && exam.startTime > now) {
      return NextResponse.json({ error: 'Exam has not started yet' }, { status: 400 });
    }
    if (exam.endTime && exam.endTime < now) {
      return NextResponse.json({ error: 'Exam has ended' }, { status: 400 });
    }

    // Check if student already submitted
    const existingResult = await prisma.result.findFirst({
      where: {
        examId,
        studentId: authUser.userId
      }
    });

    if (existingResult && existingResult.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'You have already submitted this exam' }, { status: 400 });
    }

    let resultId = existingResult?.id;
    
    if (!resultId) {
      const newResult = await prisma.result.create({
        data: {
          examId,
          studentId: authUser.userId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        }
      });
      resultId = newResult.id;
    }

    const body = await request.json();
    const validatedData = submitExamSchema.parse(body);

    // Validate all answers belong to this exam
    const questionIds = new Set(exam.questions.map((q) => q.id));
    for (const answer of validatedData.answers) {
      if (!questionIds.has(answer.questionId)) {
        return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
      }
    }

    // Delete existing answers for this result
    await prisma.studentAnswer.deleteMany({
      where: { resultId }
    });

    // Create new answers
    await prisma.studentAnswer.createMany({
      data: validatedData.answers.map((answer) => ({
        resultId,
        questionId: answer.questionId,
        optionId: answer.optionId || null,
        textAnswer: answer.textAnswer || null,
      }))
    });

    // Update result status to submitted
    const result = await prisma.result.update({
      where: { id: resultId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, resultId: result.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Exam submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
