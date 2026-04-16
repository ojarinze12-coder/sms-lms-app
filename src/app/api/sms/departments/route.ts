import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { CreateDepartmentSchema } from '@/lib/schemas/tier';
import { DEFAULT_SSS_DEPARTMENTS } from '@/lib/constants/departments';
import { SSS_TIER_CODE } from '@/lib/constants/tiers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('tierId');
    const branchId = searchParams.get('branchId');
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const whereClause: any = {
      tenantId,
      ...(tierId && { tierId }),
    };

    if (branchId) {
      whereClause.OR = [
        { branchId },
        { branchId: null },
      ];
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        tier: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = user.tenantId;
    const body = await request.json();
    const branchId = body.branchId || null;

    // Check if applying default departments
    if (body.applyDefaults && body.tierId) {
      // Verify the tier is SSS
      const tier = await prisma.tier.findUnique({ where: { id: body.tierId } });
      
      if (!tier || tier.code !== SSS_TIER_CODE) {
        return NextResponse.json(
          { error: 'Default departments can only be applied to SSS tier' },
          { status: 400 }
        );
      }

      // Check if departments already exist for this tier (considering branch)
      const existingDepts = await prisma.department.count({
        where: { 
          tierId: body.tierId,
          OR: [
            { branchId },
            { branchId: null },
          ],
        },
      });

      if (existingDepts > 0) {
        return NextResponse.json(
          { error: 'Departments already exist for this tier. Delete them first.' },
          { status: 400 }
        );
      }

      // Create default departments (filter by selectedDepts if provided)
      const selectedDeptCodes = body.selectedDepts || DEFAULT_SSS_DEPARTMENTS.map(d => d.code);
      const deptsToCreate = DEFAULT_SSS_DEPARTMENTS.filter(d => selectedDeptCodes.includes(d.code));
      
      const createdDepts = await Promise.all(
        deptsToCreate.map(async (dept) => {
          const department = await prisma.department.create({
            data: {
              name: dept.name,
              code: dept.code,
              tierId: body.tierId,
              tenantId,
              branchId,
            },
          });

          // Create subjects for the department
          await Promise.all(
            dept.subjects.map(async (subjectName, index) => {
              const code = subjectName.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
              await prisma.subject.create({
                data: {
                  name: subjectName,
                  code: `${dept.code}_${index + 1}`,
                  departmentId: department.id,
                  curriculum: body.curriculum || 'NERDC',
                  tenantId,
                },
              });
            })
          );

          return department;
        })
      );

      return NextResponse.json({
        message: 'Default departments created',
        data: createdDepts,
      }, { status: 201 });
    }

    // Create single department
    const validation = CreateDepartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid department data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, code, alias, tierId } = validation.data;

    // Check if tier exists and belongs to tenant
    const tier = await prisma.tier.findUnique({ where: { id: tierId } });
    if (!tier || tier.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check if code already exists for this tenant (considering branch)
    const existingDept = await prisma.department.findFirst({
      where: {
        tenantId,
        code,
        OR: [
          { branchId },
          { branchId: null },
        ],
      },
    });

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department with this code already exists' },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        alias,
        tierId,
        tenantId,
        branchId,
      },
    });
      },
      include: {
        tier: true,
      },
    });

    return NextResponse.json({ data: department }, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
