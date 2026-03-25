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
    const termId = searchParams.get('termId');
    const classId = searchParams.get('classId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const whereClause: any = {};

    if (termId) {
      whereClause.termId = termId;
    }

    if (classId) {
      whereClause.student = {
        enrollments: {
          some: {
            academicClassId: classId,
          },
        },
      };
    }

    const leaderboard = await prisma.reportCard.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                academicClass: true,
              },
              where: { status: 'ACTIVE' },
            },
          },
        },
        term: {
          include: {
            academicYear: true,
          },
        },
      },
      orderBy: [
        { average: 'desc' },
      ],
      take: limit,
    });

    const formatted = leaderboard.map((card, index) => ({
      rank: index + 1,
      studentId: card.student.id,
      studentName: `${card.student.firstName} ${card.student.lastName}`,
      studentIdNo: card.student.studentId,
      className: card.student.enrollments[0]?.academicClass?.name || 'N/A',
      average: card.average,
      grade: card.grade,
      term: card.term.name,
      academicYear: card.term.academicYear.name,
    }));

    return NextResponse.json({
      leaderboard: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
