'use client';

import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExamFormData, Question } from '@/types/exam-wizard';
import { examTypes } from '@/types/exam-wizard';

interface ExamReviewStepProps {
  exam: ExamFormData;
  questions: Question[];
}

export default function ExamReviewStep({ exam, questions }: ExamReviewStepProps) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Create</CardTitle>
        <CardDescription>Review your exam before creating</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <p className="font-medium">{exam.title}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Type</Label>
            <p className="font-medium">{examTypes.find(t => t.value === exam.examType)?.label}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Duration</Label>
            <p className="font-medium">{exam.duration} minutes</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Total Points</Label>
            <p className="font-medium">{totalPoints} points</p>
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground">Questions Summary</Label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {questions.map((q, i) => (
              <Badge key={q.tempId} variant="outline">
                Q{i + 1}: {q.points} pt{q.points > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
