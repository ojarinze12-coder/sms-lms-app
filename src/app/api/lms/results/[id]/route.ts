import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get result with exam details and student answers
    const { data: result, error } = await supabase
      .from('results')
      .select(`
        id, score, percentage, status, startedAt, submittedAt, gradedAt,
        student:students(id, firstName, lastName, email, studentId),
        exam:exams(
          id, title, description, examType, duration,
          subject:subjects(id, name, code),
          term:terms(id, name),
          questions(id, content, type, points, "order", options(id, content, "isCorrect", "order"))
        ),
        answers:student_answers(
          id, questionId, optionId, textAnswer, isCorrect, points,
          question:questions(content, type, points)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Check permission - students can only view their own results
    const resultData = result as any;
    if (authUser.role === 'STUDENT' && resultData.studentId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If student, hide correct answers
    if (authUser.role === 'STUDENT' && resultData.exam?.questions) {
      resultData.exam.questions = resultData.exam.questions.map((q: any) => ({
        ...q,
        options: q.options?.map((o: any) => ({
          id: o.id,
          content: o.content,
          order: o.order,
        })) || [],
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Result GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
