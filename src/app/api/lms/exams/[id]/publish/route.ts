import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
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
      },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft exams can be published' }, { status: 400 });
    }

    if (!exam.questions || exam.questions.length === 0) {
      return NextResponse.json({ error: 'Cannot publish exam without questions' }, { status: 400 });
    }

    // Verify all questions have at least one correct option
    const questionsWithOptions = await prisma.question.findMany({
      where: { examId: id },
      include: { options: true }
    });

    const questionsWithoutCorrectOption = questionsWithOptions.filter(
      (q) => !q.options.some((o) => o.isCorrect)
    );

    if (questionsWithoutCorrectOption.length > 0) {
      return NextResponse.json({ 
        error: 'All questions must have at least one correct option' 
      }, { status: 400 });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error('Exam publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
