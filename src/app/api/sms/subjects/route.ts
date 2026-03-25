import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const academicYearId = request.nextUrl.searchParams.get('academicYearId');
  const search = request.nextUrl.searchParams.get('search') || '';

  try {
    let query = supabase
      .from('subjects')
      .select('*, academic_classes(*, academic_years(*)), teachers(*)')
      .eq('academic_classes.academic_years.tenantId', authUser.tenantId)
      .order('isActive', { ascending: false })
      .order('name', { ascending: true });

    if (academicYearId) {
      query = query.eq('academicClassId', academicYearId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: subjects, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    return NextResponse.json({ data: subjects || [], pagination: { page: 1, limit: 10, total: subjects?.length || 0 } });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
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
    const { name, code, academicClassId, teacherId } = body;

    if (!name || !code || !academicClassId) {
      return NextResponse.json(
        { error: 'Name, code, and academicClassId are required' },
        { status: 400 }
      );
    }

    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('academicClassId', academicClassId)
      .eq('code', code)
      .single();

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject with this code already exists in this class' },
        { status: 400 }
      );
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({ name, code, academicClassId, teacherId: teacherId || null })
      .select()
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
