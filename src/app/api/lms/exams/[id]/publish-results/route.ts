import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const exam = await prisma.exam.findUnique({ where: { id } });
    
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if exam is completed
    if (exam.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Only completed exams can publish results' }, { status: 400 });
    }

    // Check if results have been graded
    const gradedResults = await prisma.result.count({
      where: { examId: id, status: 'GRADED' }
    });

    if (gradedResults === 0) {
      return NextResponse.json({ error: 'No graded results to publish' }, { status: 400 });
    }

    // Check settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId }
    });

    const publishResults = settings?.examResultsRequirePublish ?? true;
    
    if (publishResults) {
      // Mark results as ready for student view
      await prisma.exam.update({
        where: { id },
        data: { resultsPublishedAt: new Date() }
      });
    }

    // Get students who took the exam for notifications
    const results = await prisma.result.findMany({
      where: { examId: id },
      include: {
        student: { include: { user: true, parent: true } }
      }
    });

    // TODO: Send notifications based on settings
    // This would integrate with notification service

    return NextResponse.json({ 
      message: publishResults ? 'Results published successfully' : 'Results are now visible',
      gradedCount: gradedResults
    });
  } catch (error) {
    console.error('Publish results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}