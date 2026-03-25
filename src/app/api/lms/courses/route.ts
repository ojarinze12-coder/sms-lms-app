import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { tenantId: authUser.tenantId },
      include: { 
        tenant: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(courses || []);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, code, description, creditHours, teacherId } = data;

    if (!name || !code || !teacherId) {
      return NextResponse.json(
        { error: 'Name, code, and teacher are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.course.findFirst({
      where: { 
        tenantId: authUser.tenantId,
        code 
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        description,
        creditHours: creditHours || 3,
        teacherId,
        tenantId: authUser.tenantId,
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
