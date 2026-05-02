import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UpdateDepartmentSchema, AssignHODSchema } from '@/lib/schemas/tier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        tier: true,
        subjects: {
          select: { id: true, name: true, code: true, teacherId: true }
        },
        teachers: {
          where: { position: 'HOD' },
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (department.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: department });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingDept = await prisma.department.findUnique({ where: { id } });
    
    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (existingDept.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Handle HOD assignment separately
    if (body.headId !== undefined) {
      // Find teacher by ID and update their position
      if (body.headId) {
        const teacher = await prisma.teacher.findFirst({
          where: { id: body.headId, tenantId: user.tenantId }
        });
        
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }
        
        // Remove HOD from previous head if exists
        await prisma.teacher.updateMany({
          where: { 
            position: 'HOD',
            departmentId: id 
          },
          data: { position: null }
        });
        
        // Assign new HOD
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { 
            position: 'HOD',
            departmentId: id
          }
        });
      } else {
        // Remove HOD from current department head
        await prisma.teacher.updateMany({
          where: { 
            position: 'HOD',
            departmentId: id 
          },
          data: { position: null }
        });
      }
      
      const updatedDept = await prisma.department.findUnique({
        where: { id },
        include: {
          tier: true,
          teachers: {
            where: { position: 'HOD' },
            select: { id: true, firstName: true, lastName: true }
          },
        },
      });
      
      return NextResponse.json({ data: updatedDept });
    }
    
    // Handle regular department update
    const validation = UpdateDepartmentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid department data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: validation.data,
      include: {
        tier: true,
      },
    });

    return NextResponse.json({ data: department });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingDept = await prisma.department.findUnique({
      where: { id },
    });
    
    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (existingDept.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
