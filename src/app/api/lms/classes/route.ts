import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await prisma.academicClass.findMany({
      where: { tenantId: authUser.tenantId },
      include: {
        _count: { select: { enrollments: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(classes || []);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, year, semester, capacity, courseId } = data;

    if (!name || !year || !semester || !courseId) {
      return NextResponse.json(
        { error: 'Name, year, semester, and course are required' },
        { status: 400 }
      );
    }

    // Check for duplicate class
    const { data: existing } = await supabase
      .from('classes')
      .select('id')
      .eq('tenantId', authUser.tenantId)
      .eq('courseId', courseId)
      .eq('year', year)
      .eq('semester', semester)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This class already exists for the selected course, year, and semester' },
        { status: 400 }
      );
    }

    const { data: classItem, error } = await supabase
      .from('classes')
      .insert({
        name,
        year,
        semester,
        capacity: capacity || 30,
        courseId,
        tenantId: authUser.tenantId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    return NextResponse.json(classItem, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
