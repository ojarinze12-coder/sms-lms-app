import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { generateTimetable } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('[AI Timetable] API Key exists:', !!apiKey);
  console.log('[AI Timetable] API Key prefix:', apiKey?.substring(0, 15));
  
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not set');
    return NextResponse.json({ error: 'AI service not configured - missing API key' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { 
      subjects, 
      teachers, 
      className, 
      periodsPerDay, 
      daysPerWeek,
      schoolStartTime,
      schoolEndTime,
      breakStartTime,
      breakEndTime,
      periodDuration
    } = body;

    console.log('=== TIMETABLE API ===');
    console.log('subjects:', subjects);
    console.log('teachers:', teachers);
    console.log('className:', className);
    console.log('daysPerWeek:', daysPerWeek, 'periodsPerDay:', periodsPerDay);
    console.log('school times:', schoolStartTime, '-', schoolEndTime);
    console.log('break:', breakStartTime, '-', breakEndTime);

    if (!subjects || !teachers || !className) {
      return NextResponse.json(
        { error: 'subjects, teachers, and className are required' },
        { status: 400 }
      );
    }

    if (subjects.length !== teachers.length) {
      return NextResponse.json(
        { error: 'Number of subjects must match number of teachers' },
        { status: 400 }
      );
    }

    const timetable = await generateTimetable(
      subjects,
      teachers,
      className,
      periodsPerDay || 6,
      daysPerWeek || 5,
      schoolStartTime || "08:00",
      schoolEndTime || "15:00",
      breakStartTime || "12:00",
      breakEndTime || "12:30",
      periodDuration || 40
    );

    console.log('Timetable generated successfully');
    return NextResponse.json(timetable);
  } catch (error: any) {
    console.error('Timetable generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate timetable' },
      { status: 500 }
    );
  }
}
