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
  'NURSERY1': [2],
  'NURSERY2': [3],
  'NURSERY3': [4],
  'PRIMARY': [5, 6, 7, 8, 9, 10],
  'PRI': [5, 6, 7, 8, 9, 10],
  'PRY': [5, 6, 7, 8, 9, 10],
  'JSS': [11, 12, 13],
  'JUNIOR': [11, 12, 13],
  'SSS': [14, 15, 16],
  'SENIOR': [14, 15, 16],
  'SS': [14, 15, 16],
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
    let { tierLevels, academicYearId } = body;

    console.log('[BULK] ========== STARTING BULK SUBJECT CREATION ==========');
    console.log('[BULK] Received tierLevels:', JSON.stringify(tierLevels));
    console.log('[BULK] Received academicYearId:', academicYearId);

    if (!tierLevels || !Array.isArray(tierLevels) || tierLevels.length === 0) {
      return NextResponse.json(
        { error: 'tierLevels array is required' },
        { status: 400 }
      );
    }

    if (!authUser.tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 500 });
    }

    // Get tenant settings for curriculum
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: authUser.tenantId },
      select: { curriculumType: true, usePerTierCurriculum: true }
    });

    const globalCurriculum = settings?.curriculumType ? String(settings.curriculumType) : 'NERDC';
    const usePerTierCurriculum = settings?.usePerTierCurriculum || false;
    console.log('[BULK] Settings:', JSON.stringify(settings));
    console.log('[BULK] Global curriculum:', globalCurriculum);
    console.log('[BULK] Use per-tier curriculum:', usePerTierCurriculum);

    // Get academic year if not provided
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
        console.log('[BULK] Created new academic year:', activeYear.id);
      }
      yearId = activeYear.id;
    }

    if (!yearId) {
      return NextResponse.json({ error: 'No academic year found or created' }, { status: 500 });
    }

    console.log('[BULK] Using yearId:', yearId);

    let totalCreated = 0;
    const results: { level: number; tierId: string; created: number; existing: number }[] = [];

    // SIMPLIFIED APPROACH: Just use globalCurriculum directly as string
    const curriculumStr = String(globalCurriculum);
    console.log('[BULK] Using curriculum string:', curriculumStr);

    // Get unique levels
    const uniqueLevels = [...new Set(tierLevels.map(t => t.level))];
    console.log('[BULK] Unique levels:', uniqueLevels);

    // Test getSubjectsByCurriculum with string
    console.log('[BULK] Testing getSubjectsByCurriculum for each level:');
    for (const lvl of uniqueLevels.slice(0, 3)) {
      const subs = getSubjectsByCurriculum(lvl, curriculumStr);
      console.log(`[BULK] Level ${lvl}: ${subs.length} subjects`, subs.slice(0, 2).map(s => s.name));
    }

    for (const { tierId, level } of tierLevels) {
      console.log('[BULK] ========== PROCESSING ==========');
      console.log('[BULK] tierId:', tierId, 'level:', level);

      // Determine curriculum - use per-tier if enabled
      let curriculum = globalCurriculum;
      if (usePerTierCurriculum && tierId) {
        const tierCurriculum = await prisma.tierCurriculum.findFirst({
          where: { tierId: tierId, tenantId: authUser.tenantId },
          select: { curriculum: true }
        });
        if (tierCurriculum?.curriculum) {
          curriculum = String(tierCurriculum.curriculum);
          console.log('[BULK] Using tier-specific curriculum:', curriculum);
        }
      }
      console.log('[BULK] Using curriculum:', curriculum);

      // Get subjects for this level and curriculum
      const subjectsToAdd = getSubjectsByCurriculum(level, curriculum);
      console.log('[BULK] subjectsToAdd.length:', subjectsToAdd.length);
      
      if (subjectsToAdd.length === 0) {
        console.log('[BULK] SKIPPING - no subjects for this level');
        continue;
      }

      // Find or create the class for this level in the academic year
      let academicClass = await prisma.academicClass.findFirst({
        where: {
          level: level,
          academicYearId: yearId,
          tenantId: authUser.tenantId,
        },
        select: { id: true }
      });

      // Create class if it doesn't exist
      if (!academicClass) {
        const levelNames: Record<number, string> = {
          0: 'Creche', 1: 'Pre-Nursery', 2: 'Nursery 1', 3: 'Nursery 2', 4: 'Nursery 3',
          5: 'Primary 1', 6: 'Primary 2', 7: 'Primary 3', 8: 'Primary 4', 9: 'Primary 5', 10: 'Primary 6',
          11: 'JSS 1', 12: 'JSS 2', 13: 'JSS 3',
          14: 'SSS 1', 15: 'SSS 2', 16: 'SSS 3',
        };
        
        try {
          academicClass = await prisma.academicClass.create({
            data: {
              name: levelNames[level] || `Level ${level}`,
              level: level,
              capacity: 40,
              academicYearId: yearId,
              tenantId: authUser.tenantId,
              tierId: tierId || null,
            }
          });
        } catch (createErr: any) {
          // Handle unique constraint - class might have been created by another request
          if (createErr.code === 'P2002' || createErr.message?.includes('Unique constraint')) {
            console.log('[BULK] Class already exists, finding it...');
            academicClass = await prisma.academicClass.findFirst({
              where: {
                level: level,
                academicYearId: yearId,
                tenantId: authUser.tenantId,
              },
              select: { id: true }
            });
          } else {
            throw createErr;
          }
        }
      }

      // Skip if no class found (shouldn't happen but safety check)
      if (!academicClass) {
        console.log('[BULK] Skipping - no class found for level:', level);
        continue;
      }

      // Check existing subjects
      const existingSubjects = await prisma.subject.findMany({
        where: { academicClassId: academicClass.id },
        select: { code: true }
      });

      console.log('[BULK] Existing subjects:', existingSubjects.length, existingSubjects.map(s => s.code));

      const existingCodes = new Set(existingSubjects.map(s => s.code));
      const newSubjects = subjectsToAdd.filter(s => !existingCodes.has(s.code));

      console.log('[BULK] New subjects to create:', newSubjects.length, newSubjects.map(s => s.code));

      let createdCount = 0;
      let lastError = null;
      if (newSubjects.length > 0) {
        console.log('[BULK] Attempting to create', newSubjects.length, 'subjects for level', level);
        for (const sub of newSubjects) {
          try {
            const uniqueCode = `${sub.code}_L${level}`;
            console.log('[BULK] Creating subject:', sub.name, uniqueCode, 'curriculum:', curriculum);
            const created = await prisma.subject.create({
              data: {
                name: sub.name,
                code: uniqueCode,
                academicClassId: academicClass.id,
                tenantId: authUser.tenantId,
                curriculum: curriculum,
              }
            });
            console.log('[BULK] Created subject id:', created.id);
            createdCount++;
          } catch (err: any) {
            console.error('[BULK] ERROR creating subject:', sub.name, '- Error:', err.message);
            lastError = err.message;
          }
        }
      } else {
        console.log('[BULK] No new subjects to create - subjectsToAdd:', subjectsToAdd.length, 'existing:', existingSubjects.length);
      }

      totalCreated += createdCount;
      results.push({ level, tierId, created: createdCount, existing: subjectsToAdd.length - createdCount });
    }

    console.log('[BULK] Complete - totalCreated:', totalCreated);

    // Debug: get subjects for ALL unique levels
    const subjectsByLevel: Record<number, number> = {};
    uniqueLevels.forEach(lvl => {
      subjectsByLevel[lvl] = getSubjectsByCurriculum(lvl, globalCurriculum).length;
    });
    
    // Sample subjects for level 5
    const sampleSubjects = getSubjectsByCurriculum(5, globalCurriculum);

    // Return detailed response for debugging
    return NextResponse.json({
      success: true,
      totalCreated,
      totalProcessed: tierLevels.length,
      results: results.slice(0, 10),
      debug: {
        globalCurriculum,
        usePerTierCurriculum: settings?.usePerTierCurriculum,
        yearId,
        uniqueLevels,
        subjectsByLevel,
        sampleLevel5Subjects: sampleSubjects.map(s => s.name + '(' + s.code + ')'),
      }
    });
  } catch (error: any) {
    console.error('Error creating bulk subjects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
