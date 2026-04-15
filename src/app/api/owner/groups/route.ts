import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuperAdmin = authUser.role === 'SUPER_ADMIN';
  const isSchoolOwner = authUser.role === 'SCHOOL_OWNER';

  if (!isSuperAdmin && !isSchoolOwner) {
    return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (isSuperAdmin) {
      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            branches: true,
          }
        });
        
        const [studentCount, teacherCount, staffCount] = await Promise.all([
          prisma.student.count({ where: { tenantId } }),
          prisma.teacher.count({ where: { tenantId } }),
          prisma.staff.count({ where: { tenantId } }),
        ]);
        
        return NextResponse.json({ 
          tenant: { ...tenant, _count: { students: studentCount, teachers: teacherCount, staff: staffCount } }
        });
      }

      const tenants = await prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true,
          plan: true,
          createdAt: true,
          branches: {
            select: { id: true, name: true, code: true, isMain: true }
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ tenants });
    }

    if (isSchoolOwner && authUser.id) {
      const ownedTenants = await prisma.tenant.findMany({
        where: {
          ownerId: authUser.id,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true,
          plan: true,
          createdAt: true,
          branches: {
            select: { id: true, name: true, code: true, isMain: true }
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const tenantIds = ownedTenants.map(t => t.id);
      
      const [studentCount, teacherCount, staffCount] = await Promise.all([
        prisma.student.count({ where: { tenantId: { in: tenantIds } } }),
        prisma.teacher.count({ where: { tenantId: { in: tenantIds } } }),
        prisma.staff.count({ where: { tenantId: { in: tenantIds } } }),
      ]);

      const groupStats = {
        totalSchools: ownedTenants.length,
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalStaff: staffCount,
      };

      return NextResponse.json({ 
        tenants: ownedTenants,
        groupStats 
      });
    }

    return NextResponse.json({ error: 'No schools found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching group data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
