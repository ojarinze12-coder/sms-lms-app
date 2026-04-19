import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import type { Curriculum } from '@prisma/client';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const academicYearId = request.nextUrl.searchParams.get('academicYearId');
  const search = request.nextUrl.searchParams.get('search') || '';
  const tierId = request.nextUrl.searchParams.get('tierId');
  const branchId = request.nextUrl.searchParams.get('branchId');

  try {
    console.log('[CLASSES] Fetching for tenant:', authUser.tenantId, 'tierId:', tierId);
    
    let where: any = {};
    
    if (authUser.tenantId) {
      where.tenantId = authUser.tenantId;
    }
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }
    
    if (tierId) {
      where.tierId = tierId;
    }

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null },
      ];
    }

    const classes = await prisma.academicClass.findMany({
      where,
      orderBy: { level: 'asc' },
      take: 50,
      select: {
        id: true,
        name: true,
        level: true,
        tierId: true,
        academicYearId: true,
        subjects: { select: { id: true } },
      }
    });
    
    console.log('[CLASSES] Found:', classes.length, 'with subjects');

    return NextResponse.json({ data: classes, pagination: { page: 1, limit: 10, total: classes.length } });
  } catch (error: any) {
    console.error('[CLASSES] Full error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message || String(error),
      name: error.name,
      message: error.message
    }, { status: 500 });
  }
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
    const { name, level, capacity, academicYearId, addNerdcSubjects, tierId, stream, departmentId, classTeacherId, formMasterId, caregiverId, branchId } = body;

    console.log('[CLASSES POST] Creating class:', name, 'level:', level, 'stream:', stream, 'department:', departmentId, 'year:', academicYearId, 'tenant:', authUser.tenantId, 'addSubjects:', addNerdcSubjects, 'tierId:', tierId, 'formMasterId:', formMasterId, 'caregiverId:', caregiverId, 'branchId:', branchId);

    // Ensure addNerdcSubjects is a proper boolean
    const shouldAddSubjects = addNerdcSubjects === true || addNerdcSubjects === 'true' || addNerdcSubjects === true;
    console.log('[CLASSES POST] shouldAddSubjects:', shouldAddSubjects, 'type:', typeof addNerdcSubjects);

    if (!name || !level || !academicYearId) {
      return NextResponse.json(
        { error: 'Name, level, and academicYearId are required' },
        { status: 400 }
      );
    }

    if (!authUser.tenantId) {
      console.error('[CLASSES POST] ERROR: tenantId is undefined!');
      return NextResponse.json(
        { error: 'Tenant ID not found' },
        { status: 500 }
      );
    }

    const levelNum = parseInt(level);
    console.log('[CLASSES POST] Parsed level:', levelNum, 'isNaN:', isNaN(levelNum));

    const academicClass = await prisma.academicClass.create({
      data: {
        name,
        level: levelNum,
        capacity: capacity || 40,
        stream: stream || null,
        departmentId: departmentId || null,
        academicYearId,
        tenantId: authUser.tenantId,
        tierId: tierId || null,
        classTeacherId: classTeacherId || null,
        formMasterId: formMasterId || null,
        caregiverId: caregiverId || null,
        branchId: branchId || null,
      },
    });

    console.log('[CLASSES POST] ===== CLASS CREATED, ID:', academicClass.id, '=====');
    
    // Get department code if departmentId is provided
    let departmentCode: string | undefined;
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { code: true }
      });
      if (dept) {
        departmentCode = dept.code;
        console.log('[CLASSES POST] Department code:', departmentCode);
      }
    }
    
    // Get curriculum from tier or global settings
    let curriculum: Curriculum = 'NERDC';
    let globalCurriculum = 'NERDC';
    
    try {
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: authUser.tenantId },
        select: { curriculumType: true, usePerTierCurriculum: true }
      });
      
      if (settings?.curriculumType) {
        globalCurriculum = settings.curriculumType;
      }
      
      if (tierId && settings?.usePerTierCurriculum) {
        const tierCurriculum = await prisma.tierCurriculum.findFirst({
          where: { tierId: tierId, tenantId: authUser.tenantId },
          select: { curriculum: true }
        });
        if (tierCurriculum?.curriculum) {
          curriculum = tierCurriculum.curriculum as Curriculum;
        } else {
          curriculum = globalCurriculum as Curriculum;
        }
      } else {
        curriculum = globalCurriculum as Curriculum;
      }
    } catch (curriculumError: any) {
      console.error('[CLASSES POST] Error fetching curriculum:', curriculumError.message);
      curriculum = 'NERDC';
    }
    
    console.log('[CLASSES POST] Using curriculum:', curriculum, 'for level:', levelNum);
    
    const forceAddSubjects = true;
    console.log('[CLASSES POST] forceAddSubjects set to:', forceAddSubjects);

    if (forceAddSubjects) {
      console.log('[CLASSES POST] === ENTERING SUBJECT CREATION BLOCK ===');
      const subjectsToAdd = getSubjectsByCurriculum(levelNum, curriculum, departmentCode);
      console.log('[CLASSES POST] Subjects count:', subjectsToAdd.length, 'for department:', departmentCode);
      
      if (subjectsToAdd.length > 0) {
        console.log('[CLASSES POST] Checking existing subjects for class:', academicClass.id);
        
        const existingSubjects = await prisma.subject.findMany({
          where: { academicClassId: academicClass.id },
          select: { code: true }
        });
        console.log('[CLASSES POST] Existing subjects found:', existingSubjects.length);
        
        const existingCodes = new Set(existingSubjects.map(s => s.code));
        const newSubjects = subjectsToAdd.filter(s => !existingCodes.has(s.code));
        console.log('[CLASSES POST] New subjects to create:', newSubjects.length, '(skipping', subjectsToAdd.length - newSubjects.length, 'existing)');
        
        if (newSubjects.length > 0) {
          console.log('[CLASSES POST] Creating subjects with data:', JSON.stringify(newSubjects.map(s => ({ name: s.name, code: s.code }))));
          
          const subjectRecords = newSubjects.map(s => ({
            name: s.name,
            code: s.code,
            academicClassId: academicClass.id,
            tenantId: authUser.tenantId,
            curriculum: curriculum,
          }));

          console.log('[CLASSES POST] Subject records:', JSON.stringify(subjectRecords));
          
          try {
            console.log('[CLASSES POST] tenantId being used:', authUser.tenantId);
            console.log('[CLASSES POST] academicClassId:', academicClass.id);
            
            // Create each subject individually for better error handling
            let createdCount = 0;
            for (const record of subjectRecords) {
              try {
                console.log('[CLASSES POST] Creating subject:', record.name, record.code);
                const created = await prisma.subject.create({ 
                  data: record 
                });
                console.log('[CLASSES POST] Created subject id:', created.id);
                createdCount++;
              } catch (singleError: any) {
                console.error('[CLASSES POST] Error creating subject:', record.name, singleError.message, singleError.meta);
              }
            }
            console.log('[CLASSES POST] Subjects created, count:', createdCount);
            
            // Return the count of subjects created
            (academicClass as any).subjectsCreated = createdCount;
          } catch (subjectError: any) {
            console.error('[CLASSES POST] Subject batch creation error:', subjectError.message);
          }
        }
      }
    }

    return NextResponse.json(academicClass, { status: 201 });
  } catch (error: any) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
