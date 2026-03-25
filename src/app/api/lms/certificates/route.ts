import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createCertificateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  template: z.string().optional(),
  courseId: z.string().uuid().optional(),
  criteria: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (courseId) where.courseId = courseId;

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(certificates || []);
  } catch (error) {
    console.error('Certificates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createCertificateSchema.parse(body);

    const certificate = await prisma.certificate.create({
      data: {
        ...data,
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Certificate POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
