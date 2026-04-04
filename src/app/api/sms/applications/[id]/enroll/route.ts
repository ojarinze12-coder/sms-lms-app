import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: applicationId } = await params;
    const body = await request.json();
    const { studentId, enrollmentClassId, enrollmentAcademicYearId } = body;

    console.log('[ENROLL] Request:', { applicationId, enrollmentClassId, body });

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applyingClass: true,
        academicYear: true,
      },
    });

    console.log('[ENROLL] Application:', application?.id, 'status:', application?.status, 'body:', { studentId, enrollmentClassId, enrollmentAcademicYearId });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'APPROVED' && application.status !== 'INTERVIEW') {
      console.log('[ENROLL] Application status check:', application.status);
      return NextResponse.json({ error: `Application must be approved before enrollment. Current status: ${application.status}` }, { status: 400 });
    }

    const tenantId = authUser.tenantId || application.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    let studentRecordId: string;

    if (studentId) {
      studentRecordId = studentId;
    } else {
      const studentCount = await prisma.student.count({
        where: { tenantId },
      });

      const newStudentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`;

      const student = await prisma.student.create({
        data: {
          studentId: newStudentId,
          firstName: application.firstName,
          lastName: application.lastName,
          middleName: application.middleName,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender as any,
          phone: application.phone,
          email: application.email,
          address: application.address,
          stateOfOrigin: application.stateOfOrigin,
          lgaOfOrigin: application.lgaOfOrigin,
          birthCertNo: application.birthCertNo,
          jambRegNo: application.jambRegNo,
          status: 'ACTIVE',
          tenantId,
        },
      });

      studentRecordId = student.id;
    }

    const classId = enrollmentClassId || application.applyingClassId;
    const academicYearId = enrollmentAcademicYearId || application.academicYearId;

    if (classId) {
      await prisma.enrollment.create({
        data: {
          studentId: studentRecordId,
          classId,
          status: 'ACTIVE',
          tenantId,
        },
      });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'ENROLLED',
        enrolledStudentId: studentRecordId,
      },
    });

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    let parentId: string | null = null;
    if (settings?.allowParentRegistration && application.guardianEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: application.guardianEmail },
      });

      if (existingUser) {
        const parent = await prisma.parent.create({
          data: {
            firstName: application.guardianName || application.firstName,
            lastName: application.lastName,
            email: application.guardianEmail,
            phone: application.guardianPhone,
            address: application.guardianAddress,
            userId: existingUser.id,
            tenantId,
          },
        });
        parentId = parent.id;

        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: studentRecordId,
            relationship: (application.guardianRelation as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER') || 'GUARDIAN',
            status: 'LINKED',
            tenantId,
          },
        });
      } else {
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const newUser = await prisma.user.create({
          data: {
            email: application.guardianEmail,
            password: tempPassword,
            firstName: application.guardianName || application.firstName,
            lastName: application.lastName,
            role: 'PARENT',
            tenantId,
          },
        });

        const parent = await prisma.parent.create({
          data: {
            firstName: application.guardianName || application.firstName,
            lastName: application.lastName,
            email: application.guardianEmail,
            phone: application.guardianPhone,
            address: application.guardianAddress,
            userId: newUser.id,
            tenantId,
          },
        });
        parentId = parent.id;

        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: studentRecordId,
            relationship: (application.guardianRelation as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER') || 'GUARDIAN',
            status: 'LINKED',
            tenantId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      studentId: studentRecordId,
      parentId,
      message: 'Application enrolled successfully',
    });
  } catch (error) {
    console.error('Application enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}