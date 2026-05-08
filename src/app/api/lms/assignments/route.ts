import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'PROJECT', 'QUIZ']).default('INDIVIDUAL'),
  points: z.number().min(1).default(100),
  dueDate: z.string().datetime().optional(),
  allowLate: z.boolean().default(true),
  latePenalty: z.number().optional(),
  allowFileUpload: z.boolean().default(true),
  maxFileSize: z.number().optional(),
  classId: z.string().uuid('Invalid class ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  courseId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const mySubmissions = searchParams.get('mySubmissions') === 'true';

    const where: any = {};
    let studentId: string | null = null;

    if (authUser.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: authUser.userId },
        select: { id: true },
      });
      
      if (!student) {
        return NextResponse.json([]);
      }
      
      studentId = student.id;
      
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        select: { classId: true },
      });
      const enrolledClassIds = enrollments.map(e => e.classId);
      
      if (enrolledClassIds.length === 0) {
        return NextResponse.json([]);
      }
      
      where.AND = [
        { isPublished: true },
        { classId: { in: enrolledClassIds } },
      ];
      
      if (classId) {
        where.AND.push({ classId });
      }
      if (subjectId) {
        where.AND.push({ subjectId });
      }
    } else {
      if (classId) where.classId = classId;
      if (subjectId) where.subjectId = subjectId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        academicClass: { select: { id: true, name: true, level: true, stream: true } },
        subject: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    let assignmentsWithSubmissionStatus = assignments;
    
    if (mySubmissions && studentId) {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { studentId },
        select: { assignmentId: true, status: true, score: true },
      });
      const submittedMap = new Map(submissions.map(s => [s.assignmentId, s]));
      
      assignmentsWithSubmissionStatus = assignments.map(a => ({
        ...a,
        submitted: submittedMap.has(a.id),
        submissionStatus: submittedMap.get(a.id)?.status || null,
        score: submittedMap.get(a.id)?.score || null,
      }));
    }

    return NextResponse.json(assignmentsWithSubmissionStatus || []);
  } catch (error: any) {
    console.error('[Assignments GET] Error:', error.message || error);
    return NextResponse.json({ error: 'Internal server error: ' + (error.message || 'Unknown error') }, { status: 500 });
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
    const validatedData = createAssignmentSchema.parse(body);

    const academicClass = await prisma.academicClass.findUnique({
      where: { id: validatedData.classId },
    });

    if (!academicClass || academicClass.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid class' }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject || subject.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        type: validatedData.type,
        points: validatedData.points,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        allowLate: validatedData.allowLate,
        latePenalty: validatedData.latePenalty,
        allowFileUpload: validatedData.allowFileUpload,
        maxFileSize: validatedData.maxFileSize,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        courseId: validatedData.courseId,
        createdById: authUser.userId,
        isPublished: false,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Assignment POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}