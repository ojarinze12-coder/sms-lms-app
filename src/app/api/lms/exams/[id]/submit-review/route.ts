import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({ where: { id } });
    
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if exam can be submitted for review
    if (exam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft exams can be submitted for review' }, { status: 400 });
    }

    // Check if exam has at least one question
    const questionCount = await prisma.question.count({ where: { examId: id } });
    if (questionCount === 0) {
      return NextResponse.json({ error: 'Exam must have at least one question' }, { status: 400 });
    }

    // Check if HOD review is required
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId }
    });

    let newReviewStatus = 'APPROVED';
    if (settings?.examRequiresHodReview) {
      newReviewStatus = 'PENDING_REVIEW';
    }

    // Update exam
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        reviewStatus: newReviewStatus,
        reviewSubmittedAt: new Date(),
      }
    });

    // If auto-approved, also update status
    if (newReviewStatus === 'APPROVED') {
      await prisma.exam.update({
        where: { id },
        data: { status: 'PUBLISHED', updatedAt: new Date() }
      });
    }

    return NextResponse.json({ 
      data: updatedExam,
      autoApproved: newReviewStatus === 'APPROVED'
    });
  } catch (error) {
    console.error('Exam submit for review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}