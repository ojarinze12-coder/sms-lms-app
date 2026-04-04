import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = user.tenantId;
    const body = await req.json();
    const { action, dataTypes } = body;

    console.log(`[Data Management] Action: ${action}, Types: ${dataTypes}, Tenant: ${tenantId}`);

    if (action === 'clear') {
      const results: Record<string, { deleted: number }> = {};

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
        await prisma.enrollment.deleteMany({ where: { academicClass: { tenantId } } });
        await prisma.subject.deleteMany({ where: { academicClass: { tenantId } } });
        const deleted = await prisma.academicClass.deleteMany({ where: { tenantId } });
        results.classes = { deleted: deleted.count };
      }

      if (dataTypes.includes('subjects') && !dataTypes.includes('classes')) {
        const deleted = await prisma.subject.deleteMany({ where: { tenantId } });
        results.subjects = { deleted: deleted.count };
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

      if (dataTypes.includes('results')) {
        await prisma.studentAnswer.deleteMany({ where: { student: { tenantId } } });
        const deleted = await prisma.result.deleteMany({ where: { tenantId } });
        results.results = { deleted: deleted.count };
      }

      console.log('[Data Management] Clear results:', results);
      return NextResponse.json({ success: true, results });
    }

    if (action === 'resetSetup') {
      await prisma.tierCurriculum.deleteMany({ where: { tier: { tenantId } } });
      await prisma.department.deleteMany({ where: { tenantId } });
      await prisma.subject.deleteMany({ where: { academicClass: { tenantId } } });
      await prisma.enrollment.deleteMany({ where: { academicClass: { tenantId } } });
      await prisma.academicClass.deleteMany({ where: { tenantId } });
      await prisma.tier.deleteMany({ where: { tenantId } });
      
      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          tiersSetupComplete: false,
          curriculumType: 'NERDC',
          usePerTierCurriculum: false,
        },
      });

      console.log('[Data Management] Setup reset complete');
      return NextResponse.json({ success: true, message: 'School setup has been reset. You can now run the setup wizard again.' });
    }

    if (action === 'wipeAll') {
      await prisma.studentAnswer.deleteMany({ where: { student: { tenantId } } });
      await prisma.result.deleteMany({ where: { tenantId } });
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
      await prisma.subject.deleteMany({ where: { academicClass: { tenantId } } });
      await prisma.academicClass.deleteMany({ where: { tenantId } });
      await prisma.tierCurriculum.deleteMany({ where: { tier: { tenantId } } });
      await prisma.department.deleteMany({ where: { tenantId } });
      await prisma.tier.deleteMany({ where: { tenantId } });
      await prisma.term.deleteMany({ where: { academicYear: { tenantId } } });
      await prisma.academicYear.deleteMany({ where: { tenantId } });

      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          tiersSetupComplete: false,
          curriculumType: 'NERDC',
        },
      });

      console.log('[Data Management] All data wiped');
      return NextResponse.json({ success: true, message: 'All school data has been wiped. School setup has been reset.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing data:', error);
    return NextResponse.json({ error: 'Failed to manage data' }, { status: 500 });
  }
}
