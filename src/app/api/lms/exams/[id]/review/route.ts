import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HOD, ADMIN, PRINCIPAL can review
    if (!['HOD', 'ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden - HOD/Admin access required' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({ 
      where: { id },
      include: { 
        subject: { include: { department: true } },
        createdBy: { include: { user: true } }
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if exam is pending review
    if (exam.reviewStatus !== 'PENDING_REVIEW') {
      return NextResponse.json({ 
        error: `Exam is not pending review. Current status: ${exam.reviewStatus}` 
      }, { status: 400 });
    }

    // Check if user is authorized to review (HOD must be from the department or admin)
    if (authUser.role === 'HOD') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: authUser.userId },
        include: { department: true }
      });
      
      if (teacher?.department?.id !== exam.subject?.departmentId) {
        return NextResponse.json({ 
          error: 'You can only review exams in your department' 
        }, { status: 403 });
      }
    }

    const { action, comment } = validation.data;
    const newReviewStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Update exam
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        reviewStatus: newReviewStatus,
        reviewComment: comment || null,
        reviewedAt: new Date(),
        reviewedBy: authUser.userId,
        status: action === 'APPROVE' ? 'PUBLISHED' : 'DRAFT',
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ data: updatedExam });
  } catch (error) {
    console.error('Exam review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}