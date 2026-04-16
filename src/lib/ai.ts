async function callOpenRouter(prompt: string, systemPrompt?: string, tenantId?: string): Promise<string> {
  // Priority 1: Environment variable (Vercel) - but validate it
  let apiKey = process.env.OPENROUTER_API_KEY;
  let model = process.env.OPENROUTER_MODEL;
  
  // If env model is invalid, ignore it and use default
  const invalidEnvModels = [
    'qwen/qwen3-72b-instruct:free',
    'qwen/qwen2.5-72b-instruct:free',
    'qwen/qwen3-coder:free',
  ];
  if (model && invalidEnvModels.includes(model)) {
    console.log('Ignoring invalid env model:', model);
    model = ''; // Will use default below
  }
  
  console.log('=== AI DEBUG ===');
  console.log('API Key from env:', apiKey ? 'present' : 'NOT SET');
  console.log('Model from env:', model || 'not set (will use default)');

  // Priority 2: Tenant settings (if no env key or model)
  if (!apiKey || !model) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId },
        select: { 
          openRouterApiKey: true, 
          openRouterModel: true,
          aiEnabled: true 
        }
      });
      
      if (settings) {
        if (!apiKey && settings.openRouterApiKey) {
          apiKey = settings.openRouterApiKey;
          console.log('API Key from tenant settings: found');
        }
        if (!model && settings.openRouterModel) {
          model = settings.openRouterModel;
          console.log('Model from tenant settings:', model);
        }
      }
    } catch (err) {
      console.log('Could not fetch tenant settings:', err);
    }
  }

// Default model if none specified - use openrouter/free which auto-selects best available free model
  if (!model) {
    model = 'openrouter/free';
    console.log('Using default model (auto-router):', model);
  }

  // Map old/invalid model IDs to valid OpenRouter model IDs
  // Only include models that are confirmed to exist on OpenRouter
  const modelMap: Record<string, string> = {
    // Old Qwen names that don't work
    'qwen/qwen3-72b-instruct:free': 'openrouter/free',
    'qwen/qwen2.5-72b-instruct:free': 'openrouter/free',
    'qwen/qwen3-coder:free': 'openrouter/free',
    // DeepSeek models
    'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free': 'deepseek/deepseek-chat:free',
    // MiniMax
    'minimax/minimax-m2.5:free': 'minimax/minimax-m2.5:free',
    'minimax/minimax-m2:free': 'minimax/minimax-m2.5:free',
    // Google
    'google/gemma-3n-e4b-it:free': 'google/gemma-3n-e4b-it:free',
    'google/gemma-3-27b-it:free': 'google/gemma-3-27b-it:free',
    // Meta Llama
    'meta-llama/llama-3.3-70b-instruct': 'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.1-70b-instruct:free': 'meta-llama/llama-3.1-8b-instruct:free',
    // Anthropic
    'anthropic/claude-3.5-sonnet': 'anthropic/claude-3.5-haiku:free',
    // NVIDIA models
    'nvidia/nemotron-3-super-120b-a12b:free': 'nvidia/nemotron-3-super-120b-a12b:free',
    // OpenAI
    'openai/gpt-oss-120b:free': 'openai/gpt-oss-120b:free',
  };
  
  // Apply mapping if model is in the map
  if (modelMap[model]) {
    model = modelMap[model];
    console.log('Mapped model to:', model);
  } else {
    console.log('Using model:', model);
  }
  
  // Final safety check - use openrouter/free as ultimate fallback
  const knownWorkingModels = [
    'openrouter/free',
    'deepseek/deepseek-r1:free',
    'minimax/minimax-m2.5:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-3n-e4b-it:free',
    'google/gemma-3-27b-it:free',
    'openai/gpt-oss-120b:free',
  ];
  
  if (!knownWorkingModels.includes(model)) {
    console.log('Model not recognized, using openrouter/free as fallback');
    model = 'openrouter/free';
  }

  // Map old/invalid model IDs to valid OpenRouter model IDs
  const modelMap: Record<string, string> = {
    // Qwen models
    'qwen/qwen3-72b-instruct:free': 'qwen/qwen2.5-72b-instruct:free',
    'qwen/qwen3-coder:free': 'qwen/qwen2.5-coder-32b-instruct:free',
    'qwen/qwen3-8b-instruct:free': 'qwen/qwen2.5-8b-instruct:free',
    // DeepSeek models
    'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free': 'deepseek/deepseek-chat:free',
    // MiniMax
    'minimax/minimax-m2:free': 'minimax/minimax-text-01:free',
    // Google
    'google/gemma-3n-e4b-it:free': 'google/gemma-3n-e4b-it:free',
    'google/gemma-2-9b-it:free': 'google/gemma-2-9b-it:free',
    // Meta
    'meta-llama/llama-3.3-70b-instruct': 'meta-llama/llama-3.1-70b-instruct:free',
    'meta-llama/llama-3.2-90b-instruct:free': 'meta-llama/llama-3.1-90b-instruct:free',
    // Anthropic
    'anthropic/claude-3.5-sonnet': 'anthropic/claude-3.5-haiku:free',
    'anthropic/claude-3-opus:free': 'anthropic/claude-3-haiku:free',
    // Mistral
    'mistralai/mistral-7b-instruct:free': 'mistralai/mistral-7b-instruct:free',
    'mistralai/codestral-22b-instruct:free': 'mistralai/codestral-22b-instruct:free',
  };
  
  // Apply mapping if model is in the map
  if (modelMap[model]) {
    model = modelMap[model];
    console.log('Mapped invalid model to:', model);
  } else {
    console.log('Using model:', model);
  }
  
  // Final safety check - if model still seems invalid, use a known working one
  const validModels = [
    'qwen/qwen2.5-72b-instruct:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-3n-e4b-it:free',
    'mistralai/mistral-7b-instruct:free',
  ];
  
  if (!validModels.includes(model)) {
    console.log('Model not in valid list, using default');
    model = 'qwen/qwen2.5-72b-instruct:free';
  }

  // Check if API key is valid (not placeholder)
  if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE' || apiKey.length < 20) {
    console.log('ERROR: Invalid or missing API key');
    throw new Error('AI service not configured. Please add a valid OPENROUTER_API_KEY in Vercel environment variables (not placeholder).');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error response:', responseText.substring(0, 1000));
      
      let errorMessage = `API Error (${response.status})`;
      let errorCode = response.status.toString();
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorData.detail || errorMessage;
        errorCode = errorData.error?.code || errorCode;
      } catch {
        errorMessage = responseText.substring(0, 200) || errorMessage;
      }

      // Provide user-friendly error messages for common issues
      if (response.status === 401 || errorMessage.includes('not found') || errorMessage.includes('Missing Authentication')) {
        throw new Error('AI service not configured. Please contact your administrator to set up the OpenRouter API key.');
      }
      
      if (response.status === 403 || errorMessage.includes(' Forbidden')) {
        throw new Error('AI service access denied. Your API key may not have permission for this model.');
      }
      
      if (response.status === 429 || errorMessage.includes('rate_limit') || errorMessage.includes('Rate limit')) {
        throw new Error('AI service is busy. Please try again in a few moments.');
      }
      
      if (response.status === 402 || errorMessage.includes('credits') || errorMessage.includes('insufficient')) {
        throw new Error('AI service credits exhausted. Please contact your administrator to add credits to your OpenRouter account.');
      }
      
      if (response.status === 503 || errorMessage.includes('unavailable') || errorMessage.includes('overloaded')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid JSON response from AI API');
    }
    
    const content = data.choices?.[0]?.message?.content;
    console.log('Response content length:', content?.length || 0);
    return content || '';
  } catch (error: any) {
    console.error('callOpenRouter error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - please try again');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to call OpenRouter API');
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
  periodDuration: number = 40,
  tenantId?: string
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
    const text = await callOpenRouter(prompt, undefined, tenantId);
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
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' = 'MULTIPLE_CHOICE',
  tenantId?: string
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
    const text = await callOpenRouter(prompt, undefined, tenantId);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Question generation error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
    throw new Error('Failed to generate questions');
  }
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
  tenantId?: string
): Promise<string> {
  const prompt = `
${systemPrompt || 'You are a helpful educational assistant.'}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Provide a helpful response:
`;

  try {
    return await callOpenRouter(prompt, systemPrompt, tenantId);
  } catch (error) {
    console.error('Chat error:', error);
    throw new Error('Failed to generate response');
  }
}
