'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question, Option } from '@/types/exam-take';

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  answers: Map<string, any>;
  isFlagged: boolean;
  onAnswer: (questionId: string, optionId: string) => void;
  onTextAnswer: (questionId: string, text: string) => void;
  onToggleFlag: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export default function QuestionDisplay({
  question,
  currentIndex,
  totalQuestions,
  answers,
  isFlagged,
  onAnswer,
  onTextAnswer,
  onToggleFlag,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: QuestionDisplayProps) {
  const currentAnswer = answers.get(question.id);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">Q{currentIndex + 1}</Badge>
            <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
            <span className="text-sm text-muted-foreground">
              {question.points} point{question.points > 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant={isFlagged ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleFlag}
          >
            <Flag className="h-4 w-4 mr-2" />
            {isFlagged ? 'Flagged' : 'Flag'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-lg font-medium">{question.content}</p>
            
            {question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE' ? (
              <RadioGroup
                value={currentAnswer?.optionId || ''}
                onValueChange={(value) => onAnswer(question.id, value)}
                className="space-y-3"
              >
                {question.options
                  ?.sort((a: Option, b: Option) => a.order - b.order)
                  .map((option: Option, index: number) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        currentAnswer?.optionId === option.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => onAnswer(question.id, option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option.content}
                      </Label>
                    </div>
                  ))}
              </RadioGroup>
            ) : (
              <div>
                <Label>Your Answer</Label>
                <Textarea
                  className="mt-2"
                  rows={6}
                  placeholder="Type your answer here..."
                  value={currentAnswer?.textAnswer || ''}
                  onChange={(e) => onTextAnswer(question.id, e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
