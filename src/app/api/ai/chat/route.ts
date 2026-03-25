import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';

const ROLE_CONTEXT = {
  ADMIN: `You are an AI assistant for a School Management System (SMS) and Learning Management System (LMS). 
You help school administrators with: admissions, student management, staff management, fees collection, 
timetable generation, report cards, analytics, and general school operations. Be concise and helpful.`,
  
  TEACHER: `You are an AI assistant for a School Management System. You help teachers with: 
lesson planning, student assessment, grading, attendance, lesson notes, curriculum questions, 
and classroom management. Be concise and educational.`,
  
  STUDENT: `You are a helpful AI tutor for a student. You help with: understanding school subjects, 
homework help, exam preparation, study tips, and general school information. Be encouraging and educational.`,
  
  PARENT: `You are an AI assistant for parents using a School Management System. You help with: 
checking child progress, viewing attendance, fees inquiries, communicating with teachers, 
and understanding school policies. Be friendly and helpful.`,
};

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
  
  console.log('=== CHAT AI DEBUG ===');
  console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) : 'MISSING');
  console.log('Model:', model);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sms-lms.vercel.app',
        'X-Title': 'SMS-LMS',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Be concise and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error response:', responseText.substring(0, 500));
      throw new Error(`API Error (${response.status}): ${responseText.substring(0, 200)}`);
    }

    const data = JSON.parse(responseText);
    const content = data.choices?.[0]?.message?.content;
    console.log('Response content length:', content?.length || 0);
    return content || '';
  } catch (error) {
    console.error('callOpenRouter error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { messages, userRole } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const roleContext = ROLE_CONTEXT[userRole as keyof typeof ROLE_CONTEXT] || ROLE_CONTEXT.STUDENT;
    const conversationHistory = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const prompt = `
${roleContext}

Conversation:
${conversationHistory}

Provide a helpful response:
`;

    const response = await callOpenRouter(prompt);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
