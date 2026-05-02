'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FilePen, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  Save
} from 'lucide-react';

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  percentage: number;
  status: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  points: number;
  options?: { id: string; content: string; isCorrect: boolean }[];
}

interface Exam {
  id: string;
  title: string;
  totalPoints: number;
}

export default function ManualGradingPage() {
  const params = useParams();
  const { toast } = useToast();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  useEffect(() => {
    loadGradingData();
  }, [examId]);

  const loadGradingData = async () => {
    try {
      const [examRes, resultsRes] = await Promise.all([
        authFetch(`/api/lms/exams/${examId}`),
        authFetch(`/api/lms/exams/${examId}/results`),
      ]);

      const examData = await examRes.json();
      const resultsData = await resultsRes.json();

      setExam(examData);
      setResults(resultsData.filter((r: any) => r.status !== 'GRADED'));

      // Load questions to find SHORT_ANSWER ones
      if (examData?.questions) {
        const shortAnswerQuestions = examData.questions.filter(
          (q: Question) => q.type === 'SHORT_ANSWER'
        );
        setQuestions(shortAnswerQuestions);
      }
    } catch (err) {
      console.error('Failed to load grading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (resultId: string, questionId: string, points: number, isCorrect: boolean) => {
    setSaving(true);
    try {
      // Approve/grade via API - this would need to be implemented
      const res = await authFetch(`/api/lms/results/${resultId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          points,
          isCorrect,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Graded',
          description: 'Student answer has been graded',
        });
        loadGradingData();
      }
    } catch (err) {
      console.error('Grading error:', err);
    } finally {
      setSaving(false);
    }
  };

  const autoGradeAll = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/lms/exams/${examId}/grade`, {
        method: 'POST',
      });

      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: 'Complete',
          description: `Graded ${data.gradedCount} submissions automatically`,
        });
      }
    } catch (err) {
      console.error('Auto-grade error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ungradedCount = results.length;
  const shortAnswerQuestions = questions.filter(q => q.type === 'SHORT_ANSWER');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Manual Grading</h1>
          <p className="text-gray-600 dark:text-gray-400">{exam?.title}</p>
        </div>
        <Button onClick={autoGradeAll} disabled={saving || ungradedCount === 0}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Auto-Grade All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold dark:text-white">{results.length}</div>
              <div className="text-sm text-gray-500">Pending Grading</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {results.filter(r => r.status === 'GRADED').length}
              </div>
              <div className="text-sm text-gray-500">Graded</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{shortAnswerQuestions.length}</div>
              <div className="text-sm text-gray-500">Short Answer Questions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students Needing Grading</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All submissions have been graded!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium dark:text-white">{result.studentName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{result.studentEmail}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  
                  {shortAnswerQuestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {shortAnswerQuestions.slice(0, 2).map(q => (
                        <div key={q.id} className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                          <p className="text-sm font-medium dark:text-white mb-2">
                            Q: {q.content.substring(0, 50)}...
                          </p>
                          <p className="text-xs text-gray-500">( {q.points} points )</p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrade(result.id, q.id, q.points, false)}
                              disabled={saving}
                              className="text-red-600"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Incorrect (0)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrade(result.id, q.id, q.points, true)}
                              disabled={saving}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Correct ({q.points})
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}