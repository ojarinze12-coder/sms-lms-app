import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { createIDCardData, generateQRCodeDataURL } from '@/lib/id-card';
import { z } from 'zod';

const issueCardSchema = z.object({
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  validityYears: z.number().min(1).max(5).default(1),
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
    const status = searchParams.get('status'); // ISSUED, NOT_ISSUED, etc.

    let results;

    if (type === 'student') {
      results = await prisma.student.findMany({
        where: { tenantId, ...(status && { cardStatus: status }) },
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          photo: true,
          cardStatus: true,
          cardIssuedAt: true,
          cardExpiresAt: true,
          barcode: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else if (type === 'teacher') {
      results = await prisma.teacher.findMany({
        where: { tenantId, ...(status && { cardStatus: status }) },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          photo: true,
          cardStatus: true,
          cardIssuedAt: true,
          cardExpiresAt: true,
          barcode: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else if (type === 'staff') {
      results = await prisma.staff.findMany({
        where: { tenantId, ...(status && { cardStatus: status }) },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          category: true,
          photo: true,
          cardStatus: true,
          cardIssuedAt: true,
          cardExpiresAt: true,
          barcode: true,
        },
        orderBy: { lastName: 'asc' },
      });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('ID Card GET error:', error);
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
    const data = issueCardSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logo: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    let updated;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + data.validityYears);

    if (data.studentId) {
      const student = await prisma.student.findFirst({
        where: { id: data.studentId, tenantId },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const barcode = `STU-${student.studentId}`;
      const qrData = createIDCardData('STUDENT', student.id, student, tenant, expiresAt.toISOString().split('T')[0]);

      updated = await prisma.student.update({
        where: { id: data.studentId },
        data: {
          cardStatus: 'ISSUED',
          cardIssuedAt: new Date(),
          cardExpiresAt: expiresAt,
          barcode,
          qrCodeData: JSON.stringify(qrData),
        },
      });
    } else if (data.teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: data.teacherId, tenantId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      const barcode = `TCH-${teacher.employeeId}`;
      const qrData = createIDCardData('TEACHER', teacher.id, teacher, tenant, expiresAt.toISOString().split('T')[0]);

      updated = await prisma.teacher.update({
        where: { id: data.teacherId },
        data: {
          cardStatus: 'ISSUED',
          cardIssuedAt: new Date(),
          cardExpiresAt: expiresAt,
          barcode,
          qrCodeData: JSON.stringify(qrData),
        },
      });
    } else if (data.staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: data.staffId, tenantId },
      });

      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      }

      const barcode = `STF-${staff.employeeId}`;
      const qrData = createIDCardData('STAFF', staff.id, staff, tenant, expiresAt.toISOString().split('T')[0]);

      updated = await prisma.staff.update({
        where: { id: data.staffId },
        data: {
          cardStatus: 'ISSUED',
          cardIssuedAt: new Date(),
          cardExpiresAt: expiresAt,
          barcode,
          qrCodeData: JSON.stringify(qrData),
        },
      });
    } else {
      return NextResponse.json({ error: 'No ID specified' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('ID Card POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}