import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  lgaOfOrigin: z.string().optional(),
  birthCertNo: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  jambRegNo: z.string().optional(),
  waecNo: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianRelation: z.string().optional(),
  guardianAddress: z.string().optional(),
  applyingClassId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { applicationNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications || []);
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createApplicationSchema.parse(body);

    const tenantId = body.tenantId;

    const count = await prisma.application.count({
      where: { tenantId }
    });

    const applicationNo = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const application = await prisma.application.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        applicationNo,
        status: 'PENDING',
        tenantId: tenantId || 'default-tenant-id',
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Application POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, action, notes, entranceExamScore, interviewScore } = body;

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Application ID and action required' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    let status = application.status;
    switch (action) {
      case 'review':
        status = 'REVIEWING';
        break;
      case 'exam':
        status = 'ENTRANCE_EXAM';
        break;
      case 'interview':
        status = 'INTERVIEW';
        break;
      case 'approve':
        status = 'APPROVED';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      case 'enroll':
        status = 'ENROLLED';
        break;
      case 'withdraw':
        status = 'WITHDRAWN';
        break;
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        notes,
        entranceExamScore: entranceExamScore !== undefined ? entranceExamScore : undefined,
        interviewScore: interviewScore !== undefined ? interviewScore : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Application PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
