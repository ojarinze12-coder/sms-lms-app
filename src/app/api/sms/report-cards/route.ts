import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const termId = request.nextUrl.searchParams.get('termId');
  const studentId = request.nextUrl.searchParams.get('studentId');

  try {
    let query = supabase
      .from('report_cards')
      .select(`
        *,
        term:terms(id, name, academic_years(id, name)),
        student:students(id, firstName, lastName, studentId)
      `)
      .eq('term.academic_years.tenantId', authUser.tenantId);

    if (termId) {
      query = query.eq('termId', termId);
    }

    if (studentId) {
      query = query.eq('studentId', studentId);
    }

    const { data: reportCards, error } = await query.order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching report cards:', error);
      return NextResponse.json({ error: 'Failed to fetch report cards' }, { status: 500 });
    }

    return NextResponse.json(reportCards || []);
  } catch (error) {
    console.error('Error fetching report cards:', error);
    return NextResponse.json({ error: 'Failed to fetch report cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { termId, studentIds } = body;

    if (!termId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'termId and studentIds are required' },
        { status: 400 }
      );
    }

    const generatedCards = [];

    for (const studentId of studentIds) {
      const { data: results } = await supabase
        .from('results')
        .select(`
          id, score, percentage,
          exam:exams(id, title, subject:subjects(id, name))
        `)
        .eq('studentId', studentId)
        .eq('exam.termId', termId)
        .eq('status', 'GRADED');

      if (!results || results.length === 0) {
        continue;
      }

      const totalScore = results.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
      const totalPercentage = results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0);
      const average = totalPercentage / results.length;

      let grade = 'F';
      if (average >= 90) grade = 'A+';
      else if (average >= 80) grade = 'A';
      else if (average >= 70) grade = 'B';
      else if (average >= 60) grade = 'C';
      else if (average >= 50) grade = 'D';

      const { data: existingCard } = await supabase
        .from('report_cards')
        .select('id')
        .eq('termId', termId)
        .eq('studentId', studentId)
        .single();

      if (existingCard) {
        const { data: updatedCard } = await supabase
          .from('report_cards')
          .update({
            totalScore,
            average,
            grade,
          })
          .eq('id', existingCard.id)
          .select()
          .single();
        
        if (updatedCard) generatedCards.push(updatedCard);
      } else {
        const { data: newCard } = await supabase
          .from('report_cards')
          .insert({
            termId,
            studentId,
            totalScore,
            average,
            grade,
          })
          .select()
          .single();

        if (newCard) generatedCards.push(newCard);
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedCards.length,
      reportCards: generatedCards,
    });
  } catch (error) {
    console.error('Error generating report cards:', error);
    return NextResponse.json({ error: 'Failed to generate report cards' }, { status: 500 });
  }
}
