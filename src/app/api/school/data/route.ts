import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

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
      tenantSettings,
    ] = await Promise.all([
      prisma.student.count({ where: { tenantId } }),
      prisma.teacher.count({ where: { tenantId } }),
      prisma.staff.count({ where: { tenantId } }),
      prisma.parent.count({ where: { tenantId } }),
      prisma.academicClass.count({ where: { tenantId } }),
      prisma.subject.count({ where: { tenantId } }),
      prisma.tier.count({ where: { tenantId } }),
      prisma.department.count({ where: { tenantId } }),
      prisma.enrollment.count({ where: { tenantId } }),
      prisma.feePayment.count({ where: { tenantId } }),
      prisma.attendance.count({ where: { tenantId } }),
      prisma.announcement.count({ where: { tenantId } }),
      prisma.feeStructure.count({ where: { tenantId } }),
      prisma.tenantSettings.findUnique({ where: { tenantId } }),
    ]);

    return NextResponse.json({
      data: {
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
        tiersSetupComplete: tenantSettings?.tiersSetupComplete || false,
      },
    });
  } catch (error) {
    console.error('Error fetching data summary:', error);
    return NextResponse.json({ error: 'Failed to fetch data summary' }, { status: 500 });
  }
}
