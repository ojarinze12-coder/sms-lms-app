import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const generateReportSchema = z.object({
  termId: z.string().uuid('Invalid term ID'),
  studentIds: z.array(z.string().uuid()).optional(),
});

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
    const { termId, studentIds } = generateReportSchema.parse(body);

    const term = await prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    });

    if (!term || term.academicYear?.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
    }

    const whereClause: any = {
      exam: {
        termId,
      },
      status: 'GRADED',
    };

    if (studentIds && studentIds.length > 0) {
      whereClause.studentId = { in: studentIds };
    } else {
      whereClause.exam = {
        ...whereClause.exam,
        subject: {
          academicClass: {
            academicYear: { tenantId: authUser.tenantId },
          },
        },
      };
    }

    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        student: true,
      },
    });

    const studentResults = new Map();

    for (const result of results) {
      if (!result.studentId) continue;
      
      if (!studentResults.has(result.studentId)) {
        studentResults.set(result.studentId, {
          student: result.student,
          scores: [],
          totalScore: 0,
          subjectCount: 0,
        });
      }
      
      const studentData = studentResults.get(result.studentId);
      if (result.percentage !== null) {
        studentData.scores.push({
          subject: result.exam?.subject?.name,
          percentage: result.percentage,
        });
        studentData.totalScore += result.percentage;
        studentData.subjectCount += 1;
      }
    }

    const reportCards = [];

    for (const [studentId, data] of Array.from(studentResults.entries())) {
      const { student, scores, totalScore, subjectCount } = data as any;
      
      if (subjectCount === 0) continue;

      const average = totalScore / subjectCount;
      
      let grade = 'F';
      if (average >= 90) grade = 'A1';
      else if (average >= 80) grade = 'A2';
      else if (average >= 70) grade = 'B3';
      else if (average >= 60) grade = 'B4';
      else if (average >= 50) grade = 'C5';
      else if (average >= 40) grade = 'C6';
      else if (average >= 30) grade = 'D7';
      else if (average >= 20) grade = 'E8';

      const existingReport = await prisma.reportCard.findFirst({
        where: {
          termId,
          studentId,
        },
      });

      let reportCard;
      if (existingReport) {
        reportCard = await prisma.reportCard.update({
          where: { id: existingReport.id },
          data: {
            totalScore,
            average,
            grade,
          },
        });
      } else {
        reportCard = await prisma.reportCard.create({
          data: {
            termId,
            studentId,
            totalScore,
            average,
            grade,
          },
        });
      }

      reportCards.push({
        reportCard,
        student: {
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
        },
        scores,
        average: average.toFixed(2),
        grade,
      });
    }

    return NextResponse.json({
      success: true,
      generated: reportCards.length,
      reportCards,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Report card generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');
    const studentId = searchParams.get('studentId');

    const where: any = {};

    if (termId) where.termId = termId;
    if (studentId) where.studentId = studentId;

    const reportCards = await prisma.reportCard.findMany({
      where,
      include: {
        term: {
          include: { academicYear: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reportCards);
  } catch (error) {
    console.error('Report cards GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
