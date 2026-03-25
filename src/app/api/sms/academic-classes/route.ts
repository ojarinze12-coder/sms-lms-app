import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';
import { getSubjectsByLevel } from '@/lib/nigeria';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const academicYearId = request.nextUrl.searchParams.get('academicYearId');
  const search = request.nextUrl.searchParams.get('search') || '';

  try {
    let query = supabase
      .from('academic_classes')
      .select('*, academic_years(*), subjects(id, name, code), enrollments(id)')
      .eq('academic_years.tenantId', authUser.tenantId);

    if (academicYearId) {
      query = query.eq('academicYearId', academicYearId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: classes, error } = await query.order('level', { ascending: true });

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    return NextResponse.json({ data: classes || [], pagination: { page: 1, limit: 10, total: classes?.length || 0 } });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
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
    const { name, level, capacity, academicYearId, addNerdcSubjects } = body;

    if (!name || !level || !academicYearId) {
      return NextResponse.json(
        { error: 'Name, level, and academicYearId are required' },
        { status: 400 }
      );
    }

    const { data: existingClass } = await supabase
      .from('academic_classes')
      .select('id')
      .eq('academicYearId', academicYearId)
      .eq('name', name)
      .single();

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class with this name already exists in this academic year' },
        { status: 400 }
      );
    }

    const { data: academicClass, error } = await supabase
      .from('academic_classes')
      .insert({ name, level, capacity: capacity || 40, academicYearId })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    if (addNerdcSubjects && academicClass) {
      const subjectsToAdd = getSubjectsByLevel(level);
      console.log('Creating NERDC subjects for level:', level, 'count:', subjectsToAdd.length);
      
      if (subjectsToAdd.length > 0) {
        const subjectRecords = subjectsToAdd.map(s => ({
          name: s.name,
          code: s.code,
          academicClassId: academicClass.id,
        }));

        const { error: subjectsError } = await supabase
          .from('subjects')
          .insert(subjectRecords);

        if (subjectsError) {
          console.error('Error creating subjects:', subjectsError);
          console.error('Subject records attempted:', subjectRecords);
        } else {
          console.log('Successfully created', subjectsToAdd.length, 'subjects');
        }
      }
    }

    return NextResponse.json(academicClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
