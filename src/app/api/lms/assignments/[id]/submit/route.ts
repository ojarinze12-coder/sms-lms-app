import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const submitSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!assignment.isPublished) {
      return NextResponse.json({ error: 'Assignment is not published yet' }, { status: 400 });
    }

    if (assignment.dueDate) {
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      
      if (now > dueDate && !assignment.allowLate) {
        return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 400 });
      }
    }

    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: params.id,
        studentId: authUser.userId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = submitSchema.parse(body);

    const submission = await prisma.assignmentSubmission.create({
      data: {
        content: validatedData.content,
        fileUrl: validatedData.fileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        assignmentId: params.id,
        studentId: authUser.userId,
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Assignment submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: params.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Assignment submissions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}