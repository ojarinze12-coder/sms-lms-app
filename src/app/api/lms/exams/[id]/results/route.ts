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
