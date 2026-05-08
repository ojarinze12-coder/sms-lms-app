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
    if (!authUser || !authUser.tenantId) {
      console.log('[Assignments GET] Unauthorized - no authUser or tenantId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Assignments GET] === START ===');
    console.log('[Assignments GET] User:', authUser.userId, 'Role:', authUser.role, 'Tenant:', authUser.tenantId);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const published = searchParams.get('published');
    const mySubmissions = searchParams.get('mySubmissions') === 'true';

    console.log('[Assignments GET] Params - classId:', classId, 'subjectId:', subjectId, 'published:', published, 'mySubmissions:', mySubmissions);

    const where: any = {
      tenantId: authUser.tenantId,
    };

    console.log('[Assignments GET] Base where:', JSON.stringify(where));

    if (published === 'true') {
      where.isPublished = true;
      console.log('[Assignments GET] Added isPublished: true');
    } else if (published === 'false') {
      where.isPublished = false;
      console.log('[Assignments GET] Added isPublished: false');
    }

    if (classId) {
      where.classId = classId;
      console.log('[Assignments GET] Added classId:', classId);
    }

    if (subjectId) {
      where.subjectId = subjectId;
      console.log('[Assignments GET] Added subjectId:', subjectId);
    }

    let studentId: string | null = null;

    if (authUser.role === 'STUDENT') {
      console.log('[Assignments GET] Processing STUDENT role...');
      
      let student;
      try {
        student = await prisma.student.findFirst({
          where: { userId: authUser.userId },
          select: { id: true },
        });
        console.log('[Assignments GET] Student lookup result:', student);
      } catch (err: any) {
        console.error('[Assignments GET] Student lookup error:', err.message);
        return NextResponse.json({ error: 'Student lookup failed: ' + err.message }, { status: 500 });
      }

      if (!student) {
        console.log('[Assignments GET] No student found, returning empty');
        return NextResponse.json([]);
      }

      studentId = student.id;
      console.log('[Assignments GET] Student ID:', studentId);

      let enrollments;
      try {
        enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { classId: true },
        });
        console.log('[Assignments GET] Enrollments found:', enrollments.length);
      } catch (err: any) {
        console.error('[Assignments GET] Enrollments lookup error:', err.message);
        return NextResponse.json({ error: 'Enrollments lookup failed: ' + err.message }, { status: 500 });
      }

      const enrolledClassIds = enrollments.map(e => e.classId);

      if (enrolledClassIds.length > 0) {
        where.classId = { in: enrolledClassIds };
        console.log('[Assignments GET] Enrolled classIds:', enrolledClassIds.length);
      } else {
        console.log('[Assignments GET] No enrollments, returning empty');
        return NextResponse.json([]);
      }
    }

    console.log('[Assignments GET] Final where:', JSON.stringify(where));

    let assignments;
    try {
      assignments = await prisma.assignment.findMany({
        where,
        include: {
          academicClass: { select: { id: true, name: true, level: true, stream: true } },
          subject: { select: { id: true, name: true, code: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[Assignments GET] Assignments found:', assignments.length);
    } catch (err: any) {
      console.error('[Assignments GET] Assignment query error:', err.message);
      console.error('[Assignments GET] Error details:', JSON.stringify(err));
      return NextResponse.json({ error: 'Assignment query failed: ' + err.message }, { status: 500 });
    }

    if (mySubmissions && studentId) {
      console.log('[Assignments GET] Processing mySubmissions for studentId:', studentId);
      let submissions;
      try {
        submissions = await prisma.assignmentSubmission.findMany({
          where: { studentId },
          select: { assignmentId: true, status: true, score: true },
        });
        console.log('[Assignments GET] Submissions found:', submissions.length);
      } catch (err: any) {
        console.error('[Assignments GET] Submissions query error:', err.message);
        return NextResponse.json({ error: 'Submissions query failed: ' + err.message }, { status: 500 });
      }
      
      const submittedMap = new Map(submissions.map(s => [s.assignmentId, s]));

      const result = assignments.map(a => ({
        ...a,
        submitted: submittedMap.has(a.id),
        submissionStatus: submittedMap.get(a.id)?.status || null,
        score: submittedMap.get(a.id)?.score || null,
      }));
      
      console.log('[Assignments GET] === END - Returning with submission status ===');
      return NextResponse.json(result);
    }

    console.log('[Assignments GET] === END - Returning assignments ===');
    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('[Assignments GET] FINAL Error:', error.message || error);
    console.error('[Assignments GET] Stack:', error.stack);
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