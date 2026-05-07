import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const gradeSchema = z.object({
  grade: z.number().min(0).optional(),
  feedback: z.string().optional(),
  status: z.enum(['SUBMITTED', 'GRADED', 'RETURNED']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: params.submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.assignment.course.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = gradeSchema.parse(body);

    const updated = await prisma.assignmentSubmission.update({
      where: { id: params.submissionId },
      data: {
        ...(validatedData.grade !== undefined && { grade: validatedData.grade }),
        ...(validatedData.feedback !== undefined && { feedback: validatedData.feedback }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.status === 'GRADED' && { gradedAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Assignment grade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: params.submissionId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        assignment: { select: { title: true, points: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const canView = authUser.userId === submission.studentId || 
      ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(authUser.role);

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Submission GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}