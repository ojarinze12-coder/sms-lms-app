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

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            academicClass: true,
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        feePayments: {
          orderBy: { paidAt: 'desc' },
          take: 5,
          include: {
            feeStructure: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Failed to fetch student:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
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
    
    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        studentId: body.studentId,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        email: body.email,
        phone: body.phone,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        status: body.status,
        cardStatus: body.cardStatus,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
