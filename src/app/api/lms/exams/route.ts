import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  examType: z.enum(['QUIZ', 'MID_TERM', 'END_TERM', 'ASSIGNMENT', 'PRACTICE', 'WAEC', 'NECO', 'BECE', 'JAMB_UTME', 'MOCK']).default('QUIZ'),
  duration: z.number().min(1).max(180).default(60),
  termId: z.string().uuid('Invalid term ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const now = new Date();
    let tenantFilter: any = {};
    if (authUser.role !== 'SUPER_ADMIN' && authUser.tenantId) {
      tenantFilter = {
        OR: [
          { tenantId: authUser.tenantId },
          {
            subject: {
              academicClass: {
                academicYear: { tenantId: authUser.tenantId }
              }
            }
          }
        ]
      };
    }

    // For STUDENT role: filter by enrolled subjects and time window
    if (authUser.role === 'STUDENT') {
      // Find the student record
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: authUser.userId },
            { email: authUser.email }
          ],
          tenantId: authUser.tenantId
        }
      });

      if (student) {
        // Get student's active enrollments (filtered by branch)
        const branchFilter = student.branchId ? { branchId: student.branchId } : {};
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id, status: 'ACTIVE', ...branchFilter },
          include: {
            academicClass: {
              include: {
                subjects: { select: { id: true } }
              }
            }
          }
        });

        // Collect all subject IDs the student is enrolled in
        const subjectIds = enrollments.flatMap(e => 
          e.academicClass?.subjects?.map(s => s.id) || []
        );

        // Filter exams by enrolled subjects
        if (subjectIds.length > 0) {
          tenantFilter.subjectId = { in: subjectIds };
        } else {
          // No subjects enrolled, return empty
          return NextResponse.json([]);
        }
      }
    }

    const where: any = tenantFilter;

    // Students only see published exams within time window
    if (authUser.role === 'STUDENT') {
      where.status = 'PUBLISHED';
      // Exams are visible if:
      // - No start time set (always available), OR
      // - Within the scheduled time window
      where.OR = [
        { startTime: null },
        {
          startTime: { lte: now },
          endTime: { gte: now }
        }
      ];
    } else if (status) {
      where.status = status;
    }

    if (termId) where.termId = termId;
    if (subjectId && authUser.role !== 'STUDENT') where.subjectId = subjectId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const exams = await prisma.exam.findMany({
      where,
      include: {
        term: true,
        subject: true,
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Exams GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createExamSchema.parse(body);

    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
      include: { academicClass: { include: { academicYear: true } } }
    });

    if (!subject || subject.academicClass?.academicYear?.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        examType: validatedData.examType,
        duration: validatedData.duration,
        termId: validatedData.termId,
        subjectId: validatedData.subjectId,
        createdById: authUser.userId,
        status: 'DRAFT',
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
      }
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Exam POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
