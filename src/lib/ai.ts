async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
  
  console.log('=== AI DEBUG ===');
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
            content: systemPrompt || 'You are a helpful assistant.'
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

export async function generateTimetable(
  subjects: string[],
  teachers: string[],
  className: string,
  periodsPerDay: number = 6,
  daysPerWeek: number = 5,
  schoolStartTime: string = "08:00",
  schoolEndTime: string = "15:00",
  breakStartTime: string = "12:00",
  breakEndTime: string = "12:30",
  periodDuration: number = 40
): Promise<{
  slots: Array<{
    dayOfWeek: number;
    period: number;
    subject: string;
    teacher: string;
    startTime: string;
    endTime: string;
  }>;
}> {
  const dayLabels = daysPerWeek === 5 
    ? "Monday=0 to Friday=4" 
    : "Monday=0 to Saturday=5";
  
  const prompt = `
Generate a weekly timetable for class "${className}".

School Schedule:
- School starts at ${schoolStartTime}
- School ends at ${schoolEndTime}
- Break time: ${breakStartTime} to ${breakEndTime}
- Each period is ${periodDuration} minutes
- ${periodsPerDay} periods per day
- ${daysPerWeek} days per week (${dayLabels})

Subjects: ${subjects.join(', ')}
Teachers: ${teachers.join(', ')}

Requirements:
- ${periodsPerDay} periods per day (excluding break)
- ${daysPerWeek} days per week
- First period starts at ${schoolStartTime}
- Break period from ${breakStartTime} to ${breakEndTime} (no subjects scheduled)
- Last period ends by ${schoolEndTime}
- Each subject should be scheduled appropriately throughout the week
- Teachers should be assigned to subjects they teach
- Distribute subjects evenly across the week

Output format (JSON only, no markdown):
{
  "slots": [
    {
      "dayOfWeek": 0-${daysPerWeek - 1} (${dayLabels}),
      "period": 1-${periodsPerDay},
      "subject": "subject name",
      "teacher": "teacher name",
      "startTime": "HH:MM",
      "endTime": "HH:MM"
    }
  ]
}
`;

  try {
    const text = await callOpenRouter(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Timetable generation error:', error);
    throw new Error('Failed to generate timetable');
  }
}

export async function generateExamQuestions(
  topic: string,
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  numQuestions: number = 10,
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' = 'MULTIPLE_CHOICE'
): Promise<{
  questions: Array<{
    content: string;
    type: string;
    points: number;
    options: Array<{
      content: string;
      isCorrect: boolean;
      order: number;
    }>;
  }>;
}> {
  const prompt = `
Generate ${numQuestions} ${difficulty} ${questionType} questions for ${subject} on the topic: "${topic}".

Requirements:
- Question type: ${questionType}
- For MULTIPLE_CHOICE: 4 options per question, only 1 correct
- For TRUE_FALSE: 2 options (True/False), only 1 correct
- Each question worth 1 point
- Output in JSON format

Output format (JSON only, no markdown):
{
  "questions": [
    {
      "content": "question text",
      "type": "${questionType}",
      "points": 1,
      "options": [
        { "content": "option text", "isCorrect": true/false, "order": 1 }
      ]
    }
  ]
}
`;

  try {
    const text = await callOpenRouter(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Question generation error:', error);
    throw new Error('Failed to generate questions');
  }
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> {
  const prompt = `
${systemPrompt || 'You are a helpful educational assistant.'}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Provide a helpful response:
`;

  try {
    return await callOpenRouter(prompt, systemPrompt);
  } catch (error) {
    console.error('Chat error:', error);
    throw new Error('Failed to generate response');
  }
}
