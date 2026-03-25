'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { resultsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  BookOpen,
  Award
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const resultId = params.id as string;

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    try {
      const data = await resultsApi.get(resultId);
      setResult(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load result',
      });
      router.push('/lms/results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!result) return null;

  const exam = result.exam;
  const questions = exam?.questions || [];
  const answers = result.answers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam?.title}</h1>
          <p className="text-muted-foreground">
            {exam?.subject?.name} • {exam?.term?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={result.status === 'GRADED' ? 'success' : 'warning'}>
              {result.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {result.percentage?.toFixed(1) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Points Earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {result.score || 0}
              </span>
              <span className="text-muted-foreground">
                / {questions.reduce((sum: number, q: any) => sum + q.points, 0)} pts
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Time Taken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {result.submittedAt && result.startedAt ? (
                <span className="text-2xl font-bold">
                  {Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000)} min
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {answers.filter((a: any) => a.isCorrect).length} correct
              </span>
              <span>
                {answers.filter((a: any) => !a.isCorrect && a.points !== null).length} incorrect
              </span>
              <span>
                {answers.filter((a: any) => a.points === null).length} ungraded
              </span>
            </div>
            <Progress 
              value={
                (answers.filter((a: any) => a.isCorrect).length / questions.length) * 100
              } 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions Review</CardTitle>
          <CardDescription>
            Review your answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question: any, qIndex: number) => {
            const answer = answers.find((a: any) => a.questionId === question.id);
            const isCorrect = answer?.isCorrect;
            const isUngraded = answer?.points === null;

            return (
              <div
                key={question.id}
                className={`border rounded-lg p-4 ${
                  isCorrect
                    ? 'border-green-200 bg-green-50'
                    : isUngraded
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${
                    isCorrect ? 'text-green-600' : isUngraded ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isUngraded ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Q{qIndex + 1}</Badge>
                      <Badge variant="secondary">{question.points} pts</Badge>
                      {!isUngraded && (
                        <Badge variant={isCorrect ? 'success' : 'destructive'}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mb-3">{question.content}</p>
                    
                    {question.type !== 'SHORT_ANSWER' && question.options && (
                      <div className="space-y-2">
                        {question.options
                          .sort((a: any, b: any) => a.order - b.order)
                          .map((option: any, oIndex: number) => {
                            const isSelected = answer?.optionId === option.id;
                            const isCorrectOption = option.isCorrect;

                            return (
                              <div
                                key={option.id}
                                className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  isCorrectOption
                                    ? 'bg-green-100 border border-green-300'
                                    : isSelected
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-white'
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + oIndex)}.
                                </span>
                                <span className={isCorrectOption ? 'text-green-700 font-medium' : ''}>
                                  {option.content}
                                </span>
                                {isSelected && !isCorrectOption && (
                                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                                )}
                                {isCorrectOption && (
                                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {question.type === 'SHORT_ANSWER' && (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-muted-foreground mb-1">Your answer:</p>
                        <p>{answer?.textAnswer || 'No answer'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
