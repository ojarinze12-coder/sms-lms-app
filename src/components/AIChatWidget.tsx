'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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

export default function AIChatWidget({ userRole }: { userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    } else {
      // Welcome message
      const roleContext = ROLE_CONTEXT[userRole as keyof typeof ROLE_CONTEXT] || ROLE_CONTEXT.STUDENT;
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your AI assistant. I can help you with questions about ${userRole === 'ADMIN' ? 'school management' : 'your studies/school'}. Ask me anything!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(-4), userMessage],
          userRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.isConfigured === false) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.response || 'AI chat is not configured. Please contact your administrator to enable AI features.',
            timestamp: new Date(),
          }]);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      const errorMsg = error?.message || error?.error || 'Failed to get response';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('ai_chat_history');
    const roleContext = ROLE_CONTEXT[userRole as keyof typeof ROLE_CONTEXT] || ROLE_CONTEXT.STUDENT;
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! How can I help you today?`,
      timestamp: new Date(),
    }]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
        title="AI Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
