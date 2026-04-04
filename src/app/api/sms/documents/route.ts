import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const documentSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number(),
  categoryId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // student, teacher, staff

    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    
    if (type === 'student' && studentId) {
      where.studentId = studentId;
    } else if (type === 'teacher') {
      where.teacherId = { not: null };
    } else if (type === 'staff') {
      where.staffId = { not: null };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        category: true,
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        staff: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Document GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const data = documentSchema.parse(body);

    const category = await prisma.documentCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const document = await prisma.document.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        status: 'PENDING',
        uploadedBy: authUser.id || 'unknown',
        tenantId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Document POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}