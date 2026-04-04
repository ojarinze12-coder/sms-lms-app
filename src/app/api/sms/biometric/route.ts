import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const biometricEnrollSchema = z.object({
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  biometricType: z.enum(['FINGERPRINT', 'FACIAL_RECOGNITION', 'RFID']),
  biometricData: z.string(), // Would be encrypted in production
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // student, teacher, staff

    let results;

    if (type === 'student') {
      results = await prisma.student.findMany({
        where: { tenantId, biometricId: { not: null } },
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          biometricId: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else if (type === 'teacher') {
      results = await prisma.teacher.findMany({
        where: { tenantId, biometricId: { not: null } },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          biometricId: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else if (type === 'staff') {
      results = await prisma.staff.findMany({
        where: { tenantId, biometricId: { not: null } },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          biometricId: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Biometric GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = authUser.tenantId;
    const body = await request.json();
    const data = biometricEnrollSchema.parse(body);

    // Generate biometric ID
    const biometricId = `BIO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let updated;

    if (data.studentId) {
      const student = await prisma.student.findFirst({
        where: { id: data.studentId, tenantId },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      updated = await prisma.student.update({
        where: { id: data.studentId },
        data: { biometricId },
      });
    } else if (data.teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.teacherId, tenantId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      updated = await prisma.teacher.update({
        where: { id: data.teacherId },
        data: { biometricId },
      });
    } else if (data.staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: data.staffId, tenantId },
      });

      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      }

      updated = await prisma.staff.update({
        where: { id: data.staffId },
        data: { biometricId },
      });
    } else {
      return NextResponse.json({ error: 'No ID specified' }, { status: 400 });
    }

    return NextResponse.json({ success: true, biometricId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Biometric POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}