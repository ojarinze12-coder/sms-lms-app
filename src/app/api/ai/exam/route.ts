import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { generateExamQuestions } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('[AI Exam] Env vars with OR:', Object.keys(process.env).filter(k => k.includes('OR')).join(','));
  console.log('[AI Exam] ApiKey value:', apiKey ? 'FOUND-' + apiKey.substring(0,8) : 'NOT_FOUND');
  
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not set');
    return NextResponse.json({ error: 'AI service not configured - missing API key' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { topic, subject, difficulty, numQuestions, questionType } = body;

    console.log('=== EXAM API ===');
    console.log('topic:', topic);
    console.log('subject:', subject);
    console.log('difficulty:', difficulty);

    if (!topic || !subject) {
      return NextResponse.json(
        { error: 'topic and subject are required' },
        { status: 400 }
      );
    }

    const questions = await generateExamQuestions(
      topic,
      subject,
      difficulty || 'medium',
      numQuestions || 10,
      questionType || 'MULTIPLE_CHOICE'
    );

    console.log('Questions generated:', questions.questions?.length);
    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
