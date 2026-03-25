import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');

    // Result -> Exam -> Term -> AcademicYear (has tenantId)
    const where: any = {
      exam: {
        term: {
          academicYear: { tenantId: authUser.tenantId }
        }
      }
    };

    if (authUser.role === 'STUDENT') {
      where.studentId = authUser.userId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (examId) where.examId = examId;

    const results = await prisma.result.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: { select: { name: true, code: true } },
            term: { select: { name: true } }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Results GET error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
