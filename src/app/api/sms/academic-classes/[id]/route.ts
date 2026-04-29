import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import type { Curriculum } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, level, capacity, addNerdcSubjects, stream, departmentId, classTeacherId, formMasterId, caregiverId } = body;

    if (!name || level === undefined || !capacity) {
    return NextResponse.json(
      { error: 'Name, level, and capacity are required' },
      { status: 400 }
    );
  }

  const existingClass = await prisma.academicClass.findUnique({
    where: { id },
  });

  if (!existingClass) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Check for duplicate - considering stream
  const duplicateClass = await prisma.academicClass.findFirst({
    where: {
      academicYearId: existingClass.academicYearId,
      name: name,
      stream: stream || null,
      id: { not: id },
    },
  });
  if (duplicateClass) {
    return NextResponse.json(
      { error: 'A class with this name and stream already exists in the selected academic year' },
      { status: 400 }
    );
  }

  const levelNum = typeof level === 'string' ? parseInt(level) : level;
  
  // Update class with tier if provided
  const updateData: any = {
    name,
    level: levelNum,
    capacity: parseInt(capacity),
    stream: stream || null,
    departmentId: departmentId || null,
  };
  
  if (body.tierId !== undefined) {
    updateData.tierId = body.tierId || null;
  }
  
  // Add classTeacherId, formMasterId and caregiverId for teacher assignment
  if (classTeacherId !== undefined) {
    updateData.classTeacherId = classTeacherId || null;
  }
  if (formMasterId !== undefined) {
    updateData.formMasterId = formMasterId || null;
  }
  if (caregiverId !== undefined) {
    updateData.caregiverId = caregiverId || null;
  }
    
    const academicClass = await prisma.academicClass.update({
      where: { id },
      data: updateData,
    });

    // Get department code if departmentId is provided
    let departmentCode: string | undefined;
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { code: true }
      });
      if (dept) {
        departmentCode = dept.code;
      }
    }
    
    // Get curriculum for this class
    let curriculum: Curriculum = 'NERDC';
    try {
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: authUser.tenantId },
        select: { curriculumType: true, usePerTierCurriculum: true }
      });
      
      let globalCurriculum = (settings?.curriculumType) ? String(settings.curriculumType) : 'NERDC';
      
      if (academicClass.tierId && settings?.usePerTierCurriculum) {
        const tierCurriculum = await prisma.tierCurriculum.findFirst({
          where: { tierId: academicClass.tierId, tenantId: authUser.tenantId },
          select: { curriculum: true }
        });
        curriculum = (tierCurriculum?.curriculum || globalCurriculum) as Curriculum;
      } else {
        curriculum = globalCurriculum as Curriculum;
      }
    } catch (curriculumError: any) {
      console.error('[CLASSES PUT] Error fetching curriculum:', curriculumError.message);
      curriculum = 'NERDC';
    }
    
    if (addNerdcSubjects && academicClass) {
      const subjectsToAdd = getSubjectsByCurriculum(levelNum, curriculum, departmentCode);
      console.log('[CLASSES PUT] Adding subjects for level:', levelNum, 'curriculum:', curriculum, 'department:', departmentCode, 'count:', subjectsToAdd.length);
      
      if (subjectsToAdd.length > 0) {
        const existingSubjects = await prisma.subject.findMany({
          where: { academicClassId: id },
          select: { code: true }
        });
        
        const existingCodes = new Set(existingSubjects.map(s => s.code));
        const newSubjects = subjectsToAdd.filter(s => !existingCodes.has(s.code));
        
        console.log('[CLASSES PUT] Existing subjects:', existingSubjects.length, 'New to add:', newSubjects.length);
        
        if (newSubjects.length > 0) {
          const subjectRecords = newSubjects.map(s => ({
            name: s.name,
            code: s.code,
            academicClassId: id,
            tenantId: authUser.tenantId,
            curriculum: curriculum,
          }));

          try {
            let createdCount = 0;
            for (const record of subjectRecords) {
              try {
                const created = await prisma.subject.create({ data: record });
                createdCount++;
              } catch (singleError: any) {
                console.error('[CLASSES PUT] Error creating subject:', record.name, singleError.message);
              }
            }
            console.log('[CLASSES PUT] Subjects created, count:', createdCount);
          } catch (subjectError: any) {
            console.error('[CLASSES PUT] Subject creation error:', subjectError);
          }
        }
      }
    }

    return NextResponse.json(academicClass);
  } catch (error: any) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existingClass = await prisma.academicClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    await prisma.academicClass.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
