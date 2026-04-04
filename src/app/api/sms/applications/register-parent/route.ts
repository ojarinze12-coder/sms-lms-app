import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const registerParentSchema = z.object({
  applicationId: z.string().uuid().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string(),
  tenantSlug: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerParentSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: `Parent of Applicant`,
        role: 'PARENT',
        tenantId: tenant.id,
      },
    });

    if (data.applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: data.applicationId,
          tenantId: tenant.id,
        },
      });

      if (application) {
        const parent = await prisma.parent.create({
          data: {
            email: data.email,
            phone: data.phone,
            firstName: 'Parent',
            lastName: `of ${application.firstName}`,
            tenantId: tenant.id,
          },
        });

        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: application.enrolledStudentId || 'unknown',
            relation: 'GUARDIAN' as const,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Register parent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}