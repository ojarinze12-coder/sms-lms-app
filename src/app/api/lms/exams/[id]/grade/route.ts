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

    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check tenant access
    if (authUser.role !== 'SUPER_ADMIN') {
      const hasAccess = exam.tenantId === authUser.tenantId || 
        (exam.subjectId ? await checkExamTenantAccess(exam.subjectId, authUser.tenantId) : false);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
    }

    const results = await prisma.result.findMany({
      where: {
        examId,
        status: 'SUBMITTED'
      },
      include: {
        student: true,
        answers: true
      }
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No submitted results to grade' }, { status: 400 });
    }

    // Create a map of correct options for each question
    const questionCorrectOptions = new Map();
    for (const question of exam.questions) {
      const correctOptions = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);
      questionCorrectOptions.set(question.id, correctOptions);
    }

    // Grade each result
    const gradedResults = [];
    
    for (const result of results) {
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const answer of result.answers) {
        const question = exam.questions.find((q) => q.id === answer.questionId);
        if (!question) continue;

        totalPoints += question.points;

        // Auto-grade only MULTIPLE_CHOICE and TRUE_FALSE
        if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
          const correctOptionIds = questionCorrectOptions.get(answer.questionId);
          
          if (answer.optionId && correctOptionIds?.includes(answer.optionId)) {
            await prisma.studentAnswer.update({
              where: { id: answer.id },
              data: { isCorrect: true, points: question.points }
            });
            earnedPoints += question.points;
          } else {
            await prisma.studentAnswer.update({
              where: { id: answer.id },
              data: { isCorrect: false, points: 0 }
            });
          }
        }
      }

      const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      await prisma.result.update({
        where: { id: result.id },
        data: {
          score: earnedPoints,
          percentage,
          status: 'GRADED',
          gradedAt: new Date()
        }
      });

      gradedResults.push({
        resultId: result.id,
        student: { firstName: result.student.firstName, lastName: result.student.lastName, email: result.student.email },
        score: earnedPoints,
        totalPoints,
        percentage: percentage.toFixed(2),
      });
    }

    return NextResponse.json({
      success: true,
      gradedCount: gradedResults.length,
      results: gradedResults,
    });
  } catch (error) {
    console.error('Exam grade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkExamTenantAccess(subjectId: string, tenantId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { academicClass: { include: { academicYear: true } } }
  });
  return subject?.academicClass?.academicYear?.tenantId === tenantId;
}
