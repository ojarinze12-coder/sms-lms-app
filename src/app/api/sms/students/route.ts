import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { generateStudentId } from '@/lib/generate-id';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'generate-id') {
      const nextId = await generateStudentId(user.tenantId);
      return NextResponse.json({ studentId: nextId });
    }

    const classId = searchParams.get('classId');
    const status = searchParams.get('status');

    const where: any = { tenantId: user.tenantId };
    if (classId) {
      where.enrollments = {
        some: { classId }
      };
    }
    if (status) {
      where.status = status;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          include: {
            academicClass: true,
          },
        },
        parents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { 
      studentId, 
      firstName, 
      lastName, 
      middleName,
      email, 
      phone, 
      dateOfBirth, 
      gender,
      stateOfOrigin,
      lgaOfOrigin,
      birthCertNo,
      jambRegNo,
      bloodGroup,
      genotype,
      address,
    } = data;

    if (!studentId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'studentId, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        studentId,
        firstName,
        lastName,
        middleName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        stateOfOrigin,
        lgaOfOrigin,
        birthCertNo,
        jambRegNo,
        bloodGroup,
        genotype,
        address,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
