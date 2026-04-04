import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, status: true, createdAt: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const [
      studentCount,
      teacherCount,
      staffCount,
      parentCount,
      classCount,
      subjectCount,
      tierCount,
      departmentCount,
      enrollmentCount,
      feePaymentCount,
      attendanceCount,
      announcementCount,
      feeStructureCount,
      userCount,
      academicYearCount,
      termCount,
      tenantSettings,
    ] = await Promise.all([
      prisma.student.count({ where: { tenantId } }),
      prisma.teacher.count({ where: { tenantId } }),
      prisma.staff.count({ where: { tenantId } }),
      prisma.parent.count({ where: { tenantId } }),
      prisma.academicClass.count({ where: { academicYear: { tenantId } } }),
      prisma.subject.count({ where: { academicClass: { academicYear: { tenantId } } } }),
      prisma.tier.count({ where: { tenantId } }),
      prisma.department.count({ where: { tenantId } }),
      prisma.enrollment.count({ where: { tenantId } }),
      prisma.feePayment.count({ where: { tenantId } }),
      prisma.attendance.count({ where: { tenantId } }),
      prisma.announcement.count({ where: { tenantId } }),
      prisma.feeStructure.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.academicYear.count({ where: { tenantId } }),
      prisma.term.count({ where: { academicYear: { tenantId } } }),
      prisma.tenantSettings.findUnique({ where: { tenantId } }),
    ]);

    return NextResponse.json({
      data: {
        tenant,
        records: {
          students: studentCount,
          teachers: teacherCount,
          staff: staffCount,
          parents: parentCount,
          classes: classCount,
          subjects: subjectCount,
          tiers: tierCount,
          departments: departmentCount,
          enrollments: enrollmentCount,
          feePayments: feePaymentCount,
          attendances: attendanceCount,
          announcements: announcementCount,
          feeStructures: feeStructureCount,
          users: userCount,
          academicYears: academicYearCount,
          terms: termCount,
        },
        tiersSetupComplete: tenantSettings?.tiersSetupComplete || false,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant data summary:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;
    const body = await req.json();
    const { action, dataTypes } = body;

    console.log(`[Admin Data Management] Action: ${action}, Tenant: ${tenantId}`);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (action === 'clear') {
      const results: Record<string, { deleted: number | string }> = {};

      if (dataTypes.includes('students')) {
        const deleted = await prisma.student.deleteMany({ where: { tenantId } });
        results.students = { deleted: deleted.count };
      }

      if (dataTypes.includes('teachers')) {
        const deleted = await prisma.teacher.deleteMany({ where: { tenantId } });
        results.teachers = { deleted: deleted.count };
      }

      if (dataTypes.includes('staff')) {
        const deleted = await prisma.staff.deleteMany({ where: { tenantId } });
        results.staff = { deleted: deleted.count };
      }

      if (dataTypes.includes('parents')) {
        const deleted = await prisma.parent.deleteMany({ where: { tenantId } });
        results.parents = { deleted: deleted.count };
      }

      if (dataTypes.includes('classes')) {
        await prisma.enrollment.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        await prisma.subject.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        const deleted = await prisma.academicClass.deleteMany({ where: { academicYear: { tenantId } } });
        results.classes = { deleted: deleted.count };
      }

      if (dataTypes.includes('enrollments')) {
        const deleted = await prisma.enrollment.deleteMany({ where: { tenantId } });
        results.enrollments = { deleted: deleted.count };
      }

      if (dataTypes.includes('attendance')) {
        const deleted = await prisma.attendance.deleteMany({ where: { tenantId } });
        results.attendance = { deleted: deleted.count };
      }

      if (dataTypes.includes('announcements')) {
        const deleted = await prisma.announcement.deleteMany({ where: { tenantId } });
        results.announcements = { deleted: deleted.count };
      }

      if (dataTypes.includes('feePayments')) {
        const deleted = await prisma.feePayment.deleteMany({ where: { tenantId } });
        results.feePayments = { deleted: deleted.count };
      }

      if (dataTypes.includes('feeStructures')) {
        const deleted = await prisma.feeStructure.deleteMany({ where: { tenantId } });
        results.feeStructures = { deleted: deleted.count };
      }

      if (dataTypes.includes('academicData')) {
        await prisma.tierCurriculum.deleteMany({ where: { tenantId } });
        await prisma.department.deleteMany({ where: { tenantId } });
        await prisma.subject.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        await prisma.enrollment.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        await prisma.academicClass.deleteMany({ where: { academicYear: { tenantId } } });
        await prisma.tier.deleteMany({ where: { tenantId } });
        await prisma.term.deleteMany({ where: { academicYear: { tenantId } } });
        await prisma.academicYear.deleteMany({ where: { tenantId } });
        results.academicData = { deleted: 'all academic records' };
      }

      if (dataTypes.includes('setup')) {
        await prisma.tierCurriculum.deleteMany({ where: { tenantId } });
        await prisma.department.deleteMany({ where: { tenantId } });
        await prisma.subject.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        await prisma.enrollment.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
        await prisma.academicClass.deleteMany({ where: { academicYear: { tenantId } } });
        await prisma.tier.deleteMany({ where: { tenantId } });
        
        await prisma.tenantSettings.update({
          where: { tenantId },
          data: { tiersSetupComplete: false },
        });
        results.setup = { deleted: 'tiers, classes, subjects, departments' };
      }

      console.log('[Admin Data Management] Clear results:', results);
      return NextResponse.json({ success: true, results });
    }

    if (action === 'wipeAll') {
      await prisma.studentAnswer.deleteMany({ where: { result: { student: { tenantId } } } });
      await prisma.result.deleteMany({ where: { exam: { tenantId } } });
      await prisma.enrollment.deleteMany({ where: { tenantId } });
      await prisma.student.deleteMany({ where: { tenantId } });
      await prisma.teacher.deleteMany({ where: { tenantId } });
      await prisma.staff.deleteMany({ where: { tenantId } });
      await prisma.parent.deleteMany({ where: { tenantId } });
      await prisma.parentStudent.deleteMany({ where: { tenantId } });
      await prisma.feePayment.deleteMany({ where: { tenantId } });
      await prisma.feeStructure.deleteMany({ where: { tenantId } });
      await prisma.attendance.deleteMany({ where: { tenantId } });
      await prisma.announcement.deleteMany({ where: { tenantId } });
      await prisma.subject.deleteMany({ where: { academicClass: { academicYear: { tenantId } } } });
      await prisma.academicClass.deleteMany({ where: { academicYear: { tenantId } } });
      await prisma.tierCurriculum.deleteMany({ where: { tenantId } });
      await prisma.department.deleteMany({ where: { tenantId } });
      await prisma.tier.deleteMany({ where: { tenantId } });
      await prisma.term.deleteMany({ where: { academicYear: { tenantId } } });
      await prisma.academicYear.deleteMany({ where: { tenantId } });

      await prisma.tenantSettings.update({
        where: { tenantId },
        data: { tiersSetupComplete: false },
      });

      console.log('[Admin Data Management] All data wiped for tenant:', tenantId);
      return NextResponse.json({ success: true, message: 'All tenant data has been wiped and setup reset' });
    }

    if (action === 'suspend') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'SUSPENDED' },
      });
      return NextResponse.json({ success: true, message: 'Tenant has been suspended' });
    }

    if (action === 'activate') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });
      return NextResponse.json({ success: true, message: 'Tenant has been activated' });
    }

    if (action === 'delete') {
      await prisma.tenant.delete({ where: { id: tenantId } });
      return NextResponse.json({ success: true, message: 'Tenant has been deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing tenant data:', error);
    return NextResponse.json({ error: 'Failed to manage tenant data' }, { status: 500 });
  }
}
