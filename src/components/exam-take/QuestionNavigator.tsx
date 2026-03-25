'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answers: Map<string, any>;
  flaggedQuestions: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentQuestion,
  answers,
  flaggedQuestions,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  const getQuestionStatus = (index: number): string => {
    return 'unanswered'; // Simplified for now
  };

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-primary text-primary-foreground';
    if (status === 'answered') return 'bg-green-100 text-green-700';
    if (status === 'flagged' || status === 'answered-flagged') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  const answeredCount = answers.size;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Questions</CardTitle>
        <p className="text-xs text-muted-foreground">
          {answeredCount} of {totalQuestions} answered
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentQuestion;
            return (
              <button
                key={index}
                onClick={() => onSelectQuestion(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${getStatusColor(status, isCurrent)}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span>Flagged for review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Not answered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
