import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { hasAnyRole } from '@/lib/rbac';

function hasAdminRole(user: any): boolean {
  return hasAnyRole(user, ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_ADMIN']);
}

async function getMinPassScore(tenantId: string): Promise<number> {
  const gradingScale = await prisma.gradingScale.findFirst({
    where: { tenantId, isDefault: true },
  });
  
  if (gradingScale?.grades) {
    const grades = gradingScale.grades as any[];
    const passGrade = grades.find((g: any) => g.isPass === true || g.label === 'PASS');
    if (passGrade?.minScore) {
      return passGrade.minScore;
    }
  }
  return 50;
}

async function checkEligibility(studentId: string, settings: any, minScore: number, classId: string, academicYearId: string, branchId: string | null): Promise<{ eligible: boolean; reasons: string[]}> {
  const reasons: string[] = [];
  
  const currentEnrollment = await prisma.enrollment.findFirst({
    where: { studentId, status: 'ACTIVE' },
    include: { academicClass: { include: { academicYear: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (!currentEnrollment) {
    reasons.push('No active enrollment');
    return { eligible: false, reasons };
  }

  if (settings.promotionRequireFeesPaid) {
    const feeStructures = await prisma.feeStructure.findMany({
      where: { academicYearId },
      select: { id: true },
    });
    
    const feeStructureIds = feeStructures.map(fs => fs.id);
    
    const unpaidFees = await prisma.feePayment.findFirst({
      where: { 
        studentId, 
        status: 'PENDING',
        feeId: { in: feeStructureIds },
      },
    });
    
    if (unpaidFees) {
      reasons.push('Has unpaid fees');
    }
  }

  if (settings.promotionMinAttendance > 0) {
    const totalAttendance = await prisma.attendance.count({
      where: { studentId, classId },
    });
    const presentAttendance = await prisma.attendance.count({
      where: { studentId, classId, status: 'PRESENT' },
    });
    const attendancePercent = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 100;
    console.log(`[Eligibility] Student ${studentId}: attendance=${presentAttendance}/${totalAttendance}=${attendancePercent.toFixed(1)}%, required=${settings.promotionMinAttendance}%`);
    if (attendancePercent < settings.promotionMinAttendance) {
      reasons.push(`Attendance ${attendancePercent.toFixed(0)}% < ${settings.promotionMinAttendance}%`);
    }
  }

  const results = await prisma.result.findMany({
    where: { 
      studentId,
      branchId: branchId,
      exam: { term: { academicYearId } },
    },
  });
  console.log(`[Eligibility] Student ${studentId}: results count=${results.length}, minScore=${minScore}, branchId=${branchId}`);

  const failedSubjects = results.filter((r: any) => r.score < minScore);
  if (failedSubjects.length > 0) {
    reasons.push(`${failedSubjects.length} subject(s) below passing score`);
  }

  return { eligible: reasons.length === 0, reasons };
}

function getNextClassLevel(classes: any[], currentLevel: number): number | null {
  const sorted = classes.sort((a, b) => a.level - b.level);
  const currentIndex = sorted.findIndex(c => c.level === currentLevel);
  if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
    return sorted[currentIndex + 1].level;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceClassId = searchParams.get('sourceClassId');
    const targetClassId = searchParams.get('targetClassId');

    if (!sourceClassId) {
      return NextResponse.json({ error: 'sourceClassId required' }, { status: 400 });
    }

    const sourceClass = await prisma.academicClass.findUnique({
      where: { id: sourceClassId },
      select: { id: true, name: true, level: true, tierId: true, academicYearId: true, tenantId: true },
    });

    if (!sourceClass) {
      return NextResponse.json({ error: 'Source class not found' }, { status: 404 });
    }

    const tierId = sourceClass.tierId;
    const level = sourceClass.level || 0;

    const dbSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
    });

    const settings = {
      promotionEnabled: dbSettings?.promotionEnabled ?? true,
      promotionRequireFeesPaid: dbSettings?.promotionRequireFeesPaid ?? true,
      promotionMinAttendance: dbSettings?.promotionMinAttendance ?? 75,
      promotionAutoEnroll: dbSettings?.promotionAutoEnroll ?? true,
    };

    const minScore = await getMinPassScore(authUser.tenantId);

    // Find target classes - same tier if tierId exists, otherwise level + 1 in same tenant
    let targetWhere: any = { 
      level: level + 1, 
      tenantId: authUser.tenantId,
    };
    if (tierId) {
      targetWhere.tierId = tierId;
    }

    const targetClasses = await prisma.academicClass.findMany({
      where: targetWhere,
      orderBy: { level: 'asc' },
      take: 10,
      select: { id: true, name: true, level: true },
    });

    if (targetClasses.length === 0) {
      console.log('[PROMOTION] No target classes found for level:', level + 1);
      return NextResponse.json({
        sourceClass: { id: sourceClass.id, name: sourceClass.name },
        targetClasses: [],
        suggestedTarget: null,
        minPassScore: minScore,
        preview: [],
        summary: { total: 0, eligible: 0, ineligible: 0 },
        message: 'No target class found for the next level. Please create the destination class first.',
      });
    }

    const suggestedTarget = targetClasses[0];

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: sourceClassId, status: 'ACTIVE' },
      include: { student: true },
    });

    console.log('[PROMOTION] Enrollments found:', enrollments.length, 'for class:', sourceClassId);

const preview = await Promise.all(
    enrollments.map(async (enrollment) => {
        try {
          const { eligible, reasons } = await checkEligibility(enrollment.studentId, settings, minScore, sourceClassId, sourceClass.academicYearId, enrollment.branchId);
          return {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            studentIdno: enrollment.student.studentId,
            eligible,
            reasons,
          };
        } catch (e: any) {
          console.error(`Eligibility check error for student ${enrollment.studentId}:`, e);
          return {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            studentIdno: enrollment.student.studentId,
            eligible: false,
            reasons: [`Error: ${e.message}`],
          };
        }
      })
    );

    return NextResponse.json({
      sourceClass: { id: sourceClass.id, name: sourceClass.name },
      targetClasses: targetClasses.map(tc => ({ id: tc.id, name: tc.name })),
      suggestedTarget: suggestedTarget ? { id: suggestedTarget.id, name: suggestedTarget.name } : null,
      minPassScore: minScore,
      preview,
      summary: {
        total: preview.length,
        eligible: preview.filter(p => p.eligible).length,
        ineligible: preview.filter(p => !p.eligible).length,
      },
    });
  } catch (error: any) {
    console.error('Promotion preview error:', error);
    const message = error?.message || error?.toString() || 'Unknown error';
    return NextResponse.json({ error: `Failed to generate preview: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasAdminRole(authUser)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { sourceClassId, targetClassId, dryRun } = body;

    if (!sourceClassId || !targetClassId) {
      return NextResponse.json({ error: 'sourceClassId and targetClassId required' }, { status: 400 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
    });

    if (!settings?.promotionEnabled) {
      return NextResponse.json({ error: 'Promotion feature is disabled' }, { status: 400 });
    }

    const minScore = await getMinPassScore(authUser.tenantId);

    const sourceClass = await prisma.academicClass.findUnique({
      where: { id: sourceClassId },
    });

    const targetClass = await prisma.academicClass.findUnique({
      where: { id: targetClassId },
    });

    if (!sourceClass || !targetClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: sourceClassId, status: 'ACTIVE' },
    });

    const results = {
      promoted: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const enrollment of enrollments) {
      try {
        const { eligible, reasons } = await checkEligibility(enrollment.studentId, settings, minScore, sourceClassId, sourceClass.academicYearId, enrollment.branchId);

        if (!eligible) {
          results.skipped++;
          results.errors.push(`${enrollment.studentId}: ${reasons.join(', ')}`);
          continue;
        }

        if (dryRun) {
          results.promoted++;
          continue;
        }

        const promotionData: any = {
          studentId: enrollment.studentId,
          classId: targetClassId,
          branchId: targetClass.branchId || enrollment.branchId,
          academicYearId: targetClass.academicYearId,
          tenantId: authUser.tenantId,
          status: 'ACTIVE',
        };

        const newEnrollment = await prisma.enrollment.create({ data: promotionData });

        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'INACTIVE' },
        });

        await prisma.auditLog.create({
          data: {
            tenantId: authUser.tenantId,
            userId: authUser.userId,
            action: 'PROMOTION',
            entity: 'STUDENT',
            entityId: enrollment.studentId,
            details: JSON.stringify({
              fromClass: sourceClass.name,
              toClass: targetClass.name,
              enrollmentId: newEnrollment.id,
            }),
          },
        });

        results.promoted++;
      } catch (err: any) {
        results.errors.push(`${enrollment.studentId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      dryRun,
    });
  } catch (error) {
    console.error('Bulk promotion error:', error);
    return NextResponse.json({ error: 'Failed to promote students' }, { status: 500 });
  }
}