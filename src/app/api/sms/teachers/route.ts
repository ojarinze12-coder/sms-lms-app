import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { generateTeacherId } from '@/lib/generate-id';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'generate-id') {
      const nextId = await generateTeacherId(authUser.tenantId);
      return NextResponse.json({ employeeId: nextId });
    }

    const position = searchParams.get('position');
    const departmentId = searchParams.get('departmentId');

    const where: any = { tenantId: authUser.tenantId };
    
    if (position) {
      where.position = position;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        departmentRelation: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return NextResponse.json(teachers || []);
  } catch (error: any) {
    console.error('[TEACHERS GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { employeeId, firstName, lastName, email, specialty, phone, position, departmentId } = data;

    if (!employeeId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Employee ID, first name, last name, and email are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.teacher.findFirst({
      where: {
        tenantId: authUser.tenantId,
        employeeId: employeeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        employeeId,
        firstName,
        lastName,
        email,
        specialty,
        phone,
        position: position || null,
        departmentId: departmentId || null,
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    console.error('[TEACHERS POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}