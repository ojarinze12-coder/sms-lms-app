import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await request.json();

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.course.tenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let isPublished: boolean;
    if (action === 'publish') {
      isPublished = true;
    } else if (action === 'unpublish') {
      isPublished = false;
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "publish" or "unpublish"' }, { status: 400 });
    }

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data: { isPublished },
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error('Assignment publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}