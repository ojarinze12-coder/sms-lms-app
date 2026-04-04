import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const updateExamSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  examType: z.enum(['QUIZ', 'MID_TERM', 'END_TERM', 'ASSIGNMENT', 'PRACTICE', 'WAEC', 'NECO', 'BECE', 'JAMB_UTME', 'MOCK']).optional(),
  duration: z.number().min(1).max(180).optional(),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
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

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        term: true,
        subject: {
          include: {
            teacher: true,
            academicClass: {
              include: {
                academicYear: true
              }
            }
          }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    }) as any;

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check tenant access - allow if user is SUPER_ADMIN or if tenant matches
    if (authUser.role !== 'SUPER_ADMIN' && exam.tenantId && exam.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check subject's tenant if exam doesn't have direct tenantId
    if (authUser.role !== 'SUPER_ADMIN' && !exam.tenantId && exam.subject?.academicClass?.academicYear?.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // If student, hide correct answers and only show published exams
    if (authUser.role === 'STUDENT') {
      if (exam.status !== 'PUBLISHED') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
      
      // Remove correct answers from questions
      exam.questions = exam.questions.map((q: any) => ({
        ...q,
        options: q.options.map((o: any) => ({
          id: o.id,
          content: o.content,
          order: o.order,
        })),
      }));
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Exam GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const { id } = await params;

    const existingExam = await prisma.exam.findUnique({ where: { id } });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check tenant access
    if (authUser.role !== 'SUPER_ADMIN') {
      const hasAccess = existingExam.tenantId === authUser.tenantId || 
        (await checkExamTenantAccess(existingExam, authUser.tenantId));
      if (!hasAccess) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
    }

    if (existingExam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only edit draft exams' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateExamSchema.parse(body);

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...validatedData,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
      }
    });

    return NextResponse.json(exam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Exam PUT error:', error);
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

    const { id } = await params;

    const existingExam = await prisma.exam.findUnique({ where: { id } });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check tenant access
    if (authUser.role !== 'SUPER_ADMIN') {
      const hasAccess = existingExam.tenantId === authUser.tenantId || 
        (await checkExamTenantAccess(existingExam, authUser.tenantId));
      if (!hasAccess) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
    }

    if (existingExam.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete draft exams' }, { status: 400 });
    }

    await prisma.exam.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exam DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkExamTenantAccess(exam: any, tenantId: string): Promise<boolean> {
  if (!exam.subjectId) return false;
  const subject = await prisma.subject.findUnique({
    where: { id: exam.subjectId },
    include: { academicClass: { include: { academicYear: true } } }
  });
  return subject?.academicClass?.academicYear?.tenantId === tenantId;
}
