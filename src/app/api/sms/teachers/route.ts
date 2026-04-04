import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      where: { tenantId: authUser.tenantId },
      orderBy: { createdAt: 'desc' },
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
    const { employeeId, firstName, lastName, email, specialty, phone } = data;

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
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    console.error('[TEACHERS POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}