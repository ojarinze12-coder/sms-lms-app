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

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: true
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

    // Check if exam needs review first
    if (exam.reviewStatus === 'PENDING_REVIEW') {
      return NextResponse.json({ 
        error: 'Exam is pending HOD review. Please wait for approval.' 
      }, { status: 400 });
    }

    if (exam.reviewStatus === 'REJECTED') {
      return NextResponse.json({ 
        error: 'Exam was rejected. Please revise and submit again.' 
      }, { status: 400 });
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

    // Check if HOD review is required but not done
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId }
    });

    if (settings?.examRequiresHodReview && !['APPROVED', 'NOT_SUBMITTED'].includes(exam.reviewStatus || '')) {
      return NextResponse.json({ 
        error: 'This school requires HOD review before publishing exams.' 
      }, { status: 400 });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: { 
        status: 'PUBLISHED',
        reviewStatus: exam.reviewStatus === 'NOT_SUBMITTED' ? 'APPROVED' : exam.reviewStatus,
      }
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error('Exam publish error:', error);
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
