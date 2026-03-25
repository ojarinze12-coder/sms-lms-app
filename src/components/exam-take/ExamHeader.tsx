'use client';

import { Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExamHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  onSubmit: () => void;
  submitting: boolean;
}

export default function ExamHeader({
  title,
  currentQuestion,
  totalQuestions,
  timeLeft,
  onSubmit,
  submitting,
}: ExamHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={onSubmit} disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
