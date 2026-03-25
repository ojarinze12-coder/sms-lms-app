'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Question, Option } from '@/types/exam-wizard';

interface ExamQuestionsStepProps {
  questions: Question[];
  onAddQuestion: (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => void;
  onUpdateQuestion: (tempId: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (tempId: string) => void;
  onUpdateOption: (questionTempId: string, optionIndex: number, updates: Partial<Option>) => void;
  onSetCorrectOption: (questionTempId: string, optionIndex: number) => void;
  onAddOption: (questionTempId: string) => void;
  onRemoveOption: (questionTempId: string, optionIndex: number) => void;
}

export default function ExamQuestionsStep({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onUpdateOption,
  onSetCorrectOption,
  onAddOption,
  onRemoveOption,
}: ExamQuestionsStepProps) {
  const { toast } = useToast();

  const handleAddQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => {
    onAddQuestion(type);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Add questions to your exam</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}>
              <Plus className="mr-2 h-4 w-4" />
              Multiple Choice
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('TRUE_FALSE')}>
              <Plus className="mr-2 h-4 w-4" />
              True/False
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('SHORT_ANSWER')}>
              <Plus className="mr-2 h-4 w-4" />
              Short Answer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No questions added yet</p>
              <p className="text-sm">Click a button above to add questions</p>
            </div>
          ) : (
            questions.map((question, qIndex) => (
              <Card key={question.tempId} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{qIndex + 1}</Badge>
                      <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
                      <div className="flex items-center gap-2 ml-auto">
                        <Label className="text-sm">Points:</Label>
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={question.points}
                          onChange={(e) => onUpdateQuestion(question.tempId, { points: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Enter question content..."
                      value={question.content}
                      onChange={(e) => onUpdateQuestion(question.tempId, { content: e.target.value })}
                    />
                    {question.type !== 'SHORT_ANSWER' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Options (click to mark correct)</Label>
                        {question.options?.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Button
                              variant={option.isCorrect ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => onSetCorrectOption(question.tempId, oIndex)}
                            >
                              {String.fromCharCode(65 + oIndex)}
                            </Button>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              value={option.content}
                              onChange={(e) => onUpdateOption(question.tempId, oIndex, { content: e.target.value })}
                              className="flex-1"
                            />
                            {question.options && question.options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveOption(question.tempId, oIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddOption(question.tempId)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteQuestion(question.tempId)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
