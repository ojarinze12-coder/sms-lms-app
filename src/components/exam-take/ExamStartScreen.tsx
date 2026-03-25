'use client';

import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Exam } from '@/types/exam-take';

interface ExamStartScreenProps {
  exam: Exam;
  onStart: () => void;
}

export default function ExamStartScreen({ exam, onStart }: ExamStartScreenProps) {
  const questions = exam.questions || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          <p className="text-muted-foreground mt-2">{exam.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">{exam.duration} minutes</p>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Please note:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Once you start, the timer cannot be paused</li>
              <li>You can flag questions to review later</li>
              <li>Make sure to submit before time runs out</li>
            </ul>
          </div>
          <Button className="w-full" size="lg" onClick={onStart}>
            Start Exam
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
