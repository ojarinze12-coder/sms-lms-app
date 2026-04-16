import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        subjects: true,
        staffLeaves: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
        departmentRelation: {
          select: { id: true, name: true, code: true }
        },
        formMasterClasses: {
          select: { id: true, name: true, stream: true }
        }
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Failed to fetch teacher:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        employeeId: body.employeeId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        qualification: body.qualification,
        experience: body.experience,
        status: body.status,
        cardStatus: body.cardStatus,
        position: body.position || null,
        departmentId: body.departmentId || null,
        branchId: body.branchId || null,
      },
    });

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}
