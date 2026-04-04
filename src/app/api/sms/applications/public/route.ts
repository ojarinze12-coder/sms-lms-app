import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const publicApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
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
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelation: z.string().optional(),
  guardianAddress: z.string().optional(),
  applyingClassId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  tenantSlug: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant');
    const applicationNo = searchParams.get('applicationNo');
    const phone = searchParams.get('phone');

    if (!tenantSlug) {
      return NextResponse.json({ error: 'School not specified' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (!tenant.id) {
      return NextResponse.json({ error: 'Tenant ID missing' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!settings?.applicationsEnabled) {
      return NextResponse.json({ error: 'Online applications are closed' }, { status: 403 });
    }

    if (applicationNo && phone) {
      const application = await prisma.application.findFirst({
        where: {
          tenantId: tenant.id,
          applicationNo,
          phone,
        },
        include: {
          applyingClass: true,
        },
      });

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      return NextResponse.json(application);
    }

    const tiers = await prisma.tier.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    });
    const tierIds = tiers.map(t => t.id);

    const classes = await prisma.academicClass.findMany({
      where: { tierId: { in: tierIds } },
      select: { id: true, name: true, level: true },
      orderBy: { level: 'asc' },
    });

    const academicYears = await prisma.academicYear.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      school: { 
        name: tenant.name, 
        slug: tenant.slug,
        logo: tenant.logo,
        brandColor: tenant.brandColor,
      },
      classes,
      academicYears,
      deadline: settings.applicationDeadline,
      themeMode: settings.themeMode || 'SYSTEM',
    });
  } catch (error) {
    console.error('Public application GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = publicApplicationSchema.parse(body);

    let tenantId: string;

    if (data.tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: data.tenantSlug },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }

      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
      });

      if (settings && !settings.applicationsEnabled) {
        return NextResponse.json({ error: 'Online applications are closed' }, { status: 403 });
      }

      if (settings?.applicationDeadline && new Date() > settings.applicationDeadline) {
        return NextResponse.json({ error: 'Application deadline has passed' }, { status: 403 });
      }

      tenantId = tenant.id;
    } else {
      return NextResponse.json({ error: 'School not specified' }, { status: 400 });
    }

    const count = await prisma.application.count({
      where: { tenantId },
    });

    const applicationNo = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const application = await prisma.application.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        stateOfOrigin: data.stateOfOrigin,
        lgaOfOrigin: data.lgaOfOrigin,
        birthCertNo: data.birthCertNo,
        previousSchool: data.previousSchool,
        previousClass: data.previousClass,
        jambRegNo: data.jambRegNo,
        waecNo: data.waecNo,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        guardianRelation: data.guardianRelation,
        guardianAddress: data.guardianAddress,
        applyingClassId: data.applyingClassId,
        academicYearId: data.academicYearId,
        applicationNo,
        status: 'PENDING',
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      applicationNo: application.applicationNo,
      message: 'Application submitted successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Public application POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}