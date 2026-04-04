import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const academicClassId = request.nextUrl.searchParams.get('academicClassId') || request.nextUrl.searchParams.get('academicYearId');
  const search = request.nextUrl.searchParams.get('search') || '';

  console.log('[SUBJECTS GET] academicClassId:', academicClassId, 'tenantId:', authUser.tenantId);

  try {
    const where: any = {};
    
    if (authUser.tenantId) {
      where.tenantId = authUser.tenantId;
    }
    
    if (academicClassId) {
      where.academicClassId = academicClassId;
    }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    console.log('[SUBJECTS GET] Where clause:', JSON.stringify(where));

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        academicClass: { select: { id: true, name: true, level: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
      take: 100,
    });

    console.log('[SUBJECTS GET] Found subjects:', subjects.length);
    return NextResponse.json({ data: subjects, pagination: { page: 1, limit: 10, total: subjects.length } });
  } catch (error: any) {
    console.error('[SUBJECTS GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, code, academicClassId, teacherId } = body;

    if (!name || !code || !academicClassId) {
      return NextResponse.json(
        { error: 'Name, code, and academicClassId are required' },
        { status: 400 }
      );
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        academicClassId,
        code: code.toUpperCase(),
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject with this code already exists in this class' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        academicClassId,
        teacherId: teacherId || null,
        tenantId: authUser.tenantId,
      },
      include: {
        academicClass: { select: { id: true, name: true, level: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}