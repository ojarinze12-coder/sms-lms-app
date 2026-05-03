import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { CreateDepartmentSchema, AssignHODSchema } from '@/lib/schemas/tier';
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

    console.log('[DEPARTMENTS] START - tenantId:', tenantId, 'tierId:', tierId, 'branchId:', branchId);

    // Simple query - first get all departments for tenant/tier, then filter by branch in JS
    const query: any = { tenantId };
    if (tierId) {
      query.tierId = tierId;
    }

    const departments = await prisma.department.findMany({
      where: query,
      include: { tier: true },
      orderBy: { name: 'asc' },
    });

    console.log('[DEPARTMENTS] DB result:', departments.length, 'depts:', departments.map(d => ({ id: d.id, name: d.name, tierId: d.tierId, branchId: d.branchId })));

    // Filter by branch in JS if branchId provided
    // Show only departments for this specific branch (NOT shared null)
    let filteredDepts = departments;
    if (branchId) {
      // Only show departments assigned to this specific branch
      filteredDepts = departments.filter(d => d.branchId === branchId);
      console.log('[DEPARTMENTS] After filter by', branchId, ':', filteredDepts.length);
    }
    // If no branchId, show all departments (including shared/null)

    // Get counts for filtered departments
    const deptIds = filteredDepts.map(d => d.id);
    const subjectCounts = deptIds.length > 0 ? await prisma.subject.groupBy({
      by: ['departmentId'],
      where: { departmentId: { in: deptIds } },
      _count: true,
    }) : [];
    const classCounts = deptIds.length > 0 ? await prisma.academicClass.groupBy({
      by: ['departmentId'],
      where: { departmentId: { in: deptIds } },
      _count: true,
    }) : [];

    const subjectCountMap = new Map(subjectCounts.map(s => [s.departmentId, s._count]));
    const classCountMap = new Map(classCounts.map(c => [c.departmentId, c._count]));

    const departmentsWithCounts = filteredDepts.map(dept => ({
      ...dept,
      _count: {
        subjects: subjectCountMap.get(dept.id) || 0,
        classes: classCountMap.get(dept.id) || 0,
      }
    }));

    return NextResponse.json({ data: departmentsWithCounts });
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

    if (!['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(user.role)) {
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

    // Create single department (tierId is now optional)
    const validation = CreateDepartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid department data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, code, alias, tierId: deptTierId } = validation.data;

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
        tierId: deptTierId || null,
        tenantId,
        branchId,
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
