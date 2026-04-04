import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import type { Curriculum } from '@prisma/client';

const TIER_LEVEL_RANGES: Record<string, number[]> = {
  'PRE-SCHOOL': [0, 1, 2, 3, 4],
  'PRE_NUR': [0, 1, 2, 3, 4],
  'PRE': [0, 1, 2, 3, 4],
  'NURSERY': [2, 3, 4],
  'NUR': [2, 3, 4],
  'PRIMARY': [5, 6, 7, 8, 9, 10],
  'PRI': [5, 6, 7, 8, 9, 10],
  'PRY': [5, 6, 7, 8, 9, 10],
  'JSS': [11, 12, 13],
  'JUNIOR': [11, 12, 13],
  'SSS': [14, 15, 16],
  'SENIOR': [14, 15, 16],
  'SS': [14, 15, 16],
};

const LEVEL_NAMES: Record<number, string> = {
  0: 'Creche', 1: 'Pre-Nursery', 2: 'Nursery 1', 3: 'Nursery 2', 4: 'Nursery 3',
  5: 'Primary 1', 6: 'Primary 2', 7: 'Primary 3', 8: 'Primary 4', 9: 'Primary 5', 10: 'Primary 6',
  11: 'JSS 1', 12: 'JSS 2', 13: 'JSS 3',
  14: 'SSS 1', 15: 'SSS 2', 16: 'SSS 3',
};

function getTierLevels(tierCode: string): number[] {
  const code = tierCode.toUpperCase().replace('_', '');
  for (const [key, levels] of Object.entries(TIER_LEVEL_RANGES)) {
    const keyNormal = key.toUpperCase().replace('_', '');
    if (code.includes(keyNormal) || keyNormal.includes(code) || code.startsWith(keyNormal)) {
      return levels;
    }
  }
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tierId, academicYearId, createMissingClasses } = body;
    const shouldCreateClasses = createMissingClasses !== false;

    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 500 });
    }

    // Get tenant settings for curriculum
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: { curriculumType: true, usePerTierCurriculum: true }
    });

    const globalCurriculum = (settings?.curriculumType) ? String(settings.curriculumType) : 'NERDC';

    // Get academic year
    let yearId = academicYearId;
    if (!yearId) {
      let activeYear = await prisma.academicYear.findFirst({
        where: { tenantId: authUser.tenantId, isActive: true },
        select: { id: true }
      });
      
      if (!activeYear) {
        const currentYear = new Date().getFullYear();
        activeYear = await prisma.academicYear.create({
          data: {
            name: `${currentYear}/${currentYear + 1}`,
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${currentYear + 1}-08-31`),
            isActive: true,
            tenantId: authUser.tenantId,
          },
          select: { id: true }
        });
      }
      yearId = activeYear.id;
    }

    if (!yearId) {
      return NextResponse.json({ error: 'No academic year found or created' }, { status: 500 });
    }

    // Get tiers
    const tierWhere: any = { tenantId: authUser.tenantId };
    if (tierId) {
      tierWhere.id = tierId;
    }

    const tiers = await prisma.tier.findMany({
      where: tierWhere,
      select: { id: true, code: true }
    });

    let classesCreated = 0;
    let subjectsCreated = 0;
    const results: { tierId: string; tierName: string; classesCreated: number; subjectsCreated: number }[] = [];

    console.log('[ADD-MISSING] Starting for tenant:', authUser.tenantId, 'tiers:', tiers.length);

    for (const tier of tiers) {
      const tierLevels = getTierLevels(tier.code);
      let tierClassesCreated = 0;
      let tierSubjectsCreated = 0;

      console.log('[ADD-MISSING] Processing tier:', tier.code, 'levels:', tierLevels);

      // Get curriculum for this tier
      let curriculum: Curriculum = globalCurriculum as Curriculum;
      if (settings?.usePerTierCurriculum) {
        const tierCurriculum = await prisma.tierCurriculum.findFirst({
          where: { tierId: tier.id, tenantId: authUser.tenantId },
          select: { curriculum: true }
        });
        if (tierCurriculum?.curriculum) {
          curriculum = tierCurriculum.curriculum as Curriculum;
        }
      }
      console.log('[ADD-MISSING] Using curriculum:', curriculum, 'for tier:', tier.code);

      for (const level of tierLevels) {
        // Check if class exists
        let academicClass = await prisma.academicClass.findFirst({
          where: {
            level: level,
            academicYearId: yearId,
            tenantId: authUser.tenantId,
          },
          select: { id: true }
        });

        // Create class if it doesn't exist and flag is set
        if (!academicClass && shouldCreateClasses) {
          try {
            academicClass = await prisma.academicClass.create({
              data: {
                name: LEVEL_NAMES[level] || `Level ${level}`,
                level: level,
                capacity: 40,
                academicYearId: yearId,
                tenantId: authUser.tenantId,
                tierId: tier.id,
              }
            });
            tierClassesCreated++;
            console.log('[ADD-MISSING] Created class:', LEVEL_NAMES[level]);
          } catch (err: any) {
            // Handle unique constraint - class might already exist
            if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
              console.log('[ADD-MISSING] Class already exists, finding it...');
              academicClass = await prisma.academicClass.findFirst({
                where: {
                  level: level,
                  academicYearId: yearId,
                  tenantId: authUser.tenantId,
                },
                select: { id: true }
              });
            } else {
              console.error('[ADD-MISSING] Error creating class:', LEVEL_NAMES[level], err);
            }
          }
        }

        if (!academicClass) {
          continue;
        }

        // Get subjects for this level and curriculum
        const subjectsToAdd = getSubjectsByCurriculum(level, curriculum);
        
        if (subjectsToAdd.length === 0) {
          continue;
        }

        // Check existing subjects
        const existingSubjects = await prisma.subject.findMany({
          where: { academicClassId: academicClass.id },
          select: { code: true }
        });

        const existingCodes = new Set(existingSubjects.map(s => s.code));
        const newSubjects = subjectsToAdd.filter(s => !existingCodes.has(s.code));

        if (newSubjects.length > 0) {
          for (const sub of newSubjects) {
            try {
              const uniqueCode = `${sub.code}_L${level}`;
              await prisma.subject.create({
                data: {
                  name: sub.name,
                  code: uniqueCode,
                  academicClassId: academicClass.id,
                  tenantId: authUser.tenantId,
                  curriculum: curriculum,
                }
              });
              tierSubjectsCreated++;
            } catch (err) {
              console.error('[ADD-MISSING] Error creating subject:', sub.name, err);
            }
          }
        }
      }

        if (tierSubjectsCreated > 0 || tierClassesCreated > 0) {
        const tierName = tier.code;
        results.push({ 
          tierId: tier.id, 
          tierName, 
          classesCreated: tierClassesCreated, 
          subjectsCreated: tierSubjectsCreated 
        });
        classesCreated += tierClassesCreated;
        subjectsCreated += tierSubjectsCreated;
      }
    }

    console.log('[ADD-MISSING] Complete - classes:', classesCreated, 'subjects:', subjectsCreated);

    return NextResponse.json({
      success: true,
      classesCreated,
      subjectsCreated,
      tiersProcessed: tiers.length,
      results,
      debug: {
        globalCurriculum,
        usePerTierCurriculum: settings?.usePerTierCurriculum,
        yearId,
      }
    });
  } catch (error: any) {
    console.error('Error adding missing subjects:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
