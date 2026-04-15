import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = { tenantId: authUser.tenantId };
    
    if (branchId) {
      where.branchId = branchId;
    }
    if (classId) {
      where.classId = classId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (status) {
      where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            branchId: true,
          },
        },
        academicClass: {
          select: {
            id: true,
            name: true,
            level: true,
            stream: true,
            branchId: true,
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, classId } = body;

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student and class are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.enrollment.findFirst({
      where: {
        tenantId: authUser.tenantId,
        studentId,
        classId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this class' },
        { status: 400 }
      );
    }

    const [student, academicClass] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { branchId: true } }),
      prisma.academicClass.findUnique({ where: { id: classId }, select: { branchId: true } }),
    ]);

    const branchId = student?.branchId || academicClass?.branchId || null;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        tenantId: authUser.tenantId,
        branchId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        academicClass: {
          select: {
            id: true,
            name: true,
            level: true,
            stream: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
