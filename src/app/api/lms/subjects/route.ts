import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicClassId = searchParams.get('academicClassId');
    const search = searchParams.get('search') || '';

    const where: any = {
      tenantId: authUser.tenantId,
      isActive: true,
    };

    if (academicClassId) {
      where.academicClassId = academicClassId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        academicClass: { 
          select: { id: true, name: true, level: true, stream: true } 
        },
        teacher: { 
          select: { id: true, firstName: true, lastName: true } 
        },
        department: { 
          select: { id: true, name: true } 
        },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return NextResponse.json(subjects || []);
  } catch (error: any) {
    console.error('[LMS Subjects GET] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}