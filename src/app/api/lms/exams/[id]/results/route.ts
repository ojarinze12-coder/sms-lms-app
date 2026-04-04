import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: examId } = await params;

    // First verify the exam exists and user has access
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          include: {
            academicClass: {
              include: { academicYear: true }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check tenant access
    if (authUser.role !== 'SUPER_ADMIN') {
      const hasAccess = exam.tenantId === authUser.tenantId || 
        exam.subject?.academicClass?.academicYear?.tenantId === authUser.tenantId;
      if (!hasAccess) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
    }

    const results = await prisma.result.findMany({
      where: { examId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true, studentId: true }
        }
      },
      orderBy: { percentage: 'desc' }
    });

    // Add rank
    const rankedResults = results.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

    return NextResponse.json(rankedResults);
  } catch (error) {
    console.error('Exam results GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
