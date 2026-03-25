import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';
import { getSubjectsByLevel } from '@/lib/nigeria';

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
    const { name, level, capacity, addNerdcSubjects } = body;

    if (!name || level === undefined || !capacity) {
      return NextResponse.json(
        { error: 'Name, level, and capacity are required' },
        { status: 400 }
      );
    }

    const { data: existingClass, error: fetchError } = await supabase
      .from('academic_classes')
      .select('id, academicYearId')
      .eq('id', id)
      .single();

    if (fetchError || !existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const { data: academicClass, error } = await supabase
      .from('academic_classes')
      .update({ name, level, capacity })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }

    if (addNerdcSubjects && academicClass) {
      const subjectsToAdd = getSubjectsByLevel(level);
      console.log('Adding NERDC subjects for level:', level, 'count:', subjectsToAdd.length);
      
      if (subjectsToAdd.length > 0) {
        const { data: existingSubjects } = await supabase
          .from('subjects')
          .select('code')
          .eq('academicClassId', id);
        
        const existingCodes = new Set(existingSubjects?.map(s => s.code) || []);
        const newSubjects = subjectsToAdd.filter(s => !existingCodes.has(s.code));
        
        console.log('Existing subjects:', existingSubjects?.length, 'New to add:', newSubjects.length);
        
        if (newSubjects.length > 0) {
          const subjectRecords = newSubjects.map(s => ({
            name: s.name,
            code: s.code,
            academicClassId: id,
          }));

          const { error: subjectsError } = await supabase
            .from('subjects')
            .insert(subjectRecords);

          if (subjectsError) {
            console.error('Error creating subjects:', subjectsError);
          } else {
            console.log('Successfully added', newSubjects.length, 'new subjects');
          }
        }
      }
    }

    return NextResponse.json(academicClass);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
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

    const { error } = await supabase
      .from('academic_classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting class:', error);
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
