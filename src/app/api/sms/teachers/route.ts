import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('tenantId', authUser.tenantId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }

    return NextResponse.json(teachers || []);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { employeeId, firstName, lastName, email, specialty, phone } = data;

    if (!employeeId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Employee ID, first name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate employee ID within tenant
    const { data: existing } = await supabase
      .from('teachers')
      .select('id')
      .eq('tenantId', authUser.tenantId)
      .eq('employeeId', employeeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert({
        employeeId,
        firstName,
        lastName,
        email,
        specialty,
        phone,
        tenantId: authUser.tenantId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating teacher:', error);
      return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
    }

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
