import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { sendResultNotificationEmail } from '@/lib/email';

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
    const { termId } = body;

    if (!termId) {
      return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
    }

    const term = await prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    });

    if (!term || term.academicYear.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
    }

    const gradedResults = await prisma.result.findMany({
      where: {
        exam: {
          termId,
        },
        status: 'GRADED',
      },
      include: {
        student: true,
        exam: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
    });

    const notificationsSent = [];
    const errors = [];

    for (const result of gradedResults) {
      if (!result.studentId) continue;

      const parentLinks = await prisma.parentStudent.findMany({
        where: {
          studentId: result.studentId,
          approvalStatus: 'APPROVED',
        },
        include: {
          parent: true,
        },
      });

      for (const link of parentLinks) {
        if (link.parent.email) {
          try {
            await sendResultNotificationEmail(
              link.parent.email,
              link.parent.firstName,
              `${result.student.firstName} ${result.student.lastName}`,
              result.exam.title,
              result.exam.subject.name,
              result.score,
              result.percentage,
              result.grade || 'N/A'
            );
            notificationsSent.push({
              student: `${result.student.firstName} ${result.student.lastName}`,
              parent: link.parent.email,
            });
          } catch (error) {
            errors.push({
              parent: link.parent.email,
              error: 'Failed to send email',
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${notificationsSent.length} notifications`,
      sent: notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Result notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
