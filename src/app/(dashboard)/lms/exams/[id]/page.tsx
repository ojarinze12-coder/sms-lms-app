'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examApi } from '@/lib/api';
import { Exam, Question } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Calendar,
  Users,
  CheckCircle,
  Edit,
  Upload,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const examTypeLabels: Record<string, string> = {
  QUIZ: 'Quiz',
  MID_TERM: 'Mid Term',
  END_TERM: 'End Term',
  ASSIGNMENT: 'Assignment',
  PRACTICE: 'Practice',
  WAEC: 'WAEC',
  NECO: 'NECO',
  BECE: 'BECE',
  JAMB_UTME: 'JAMB UTME',
  MOCK: 'Mock Exam',
};

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'destructive',
};

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const examId = params.id as string;

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const data = await examApi.get(examId);
      setExam(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load exam',
      });
      router.push('/lms/exams');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      await examApi.publish(examId);
      toast({
        title: 'Success',
        description: 'Exam published successfully',
      });
      loadExam();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async () => {
    setSubmitting(true);
    try {
      const result = await examApi.grade(examId);
      toast({
        title: 'Success',
        description: `Graded ${result.gradedCount} submissions`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
    
    setSubmitting(true);
    try {
      await examApi.delete(examId);
      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
      });
      router.push('/lms/exams');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await examApi.deleteQuestion(examId, questionId);
      toast({
        title: 'Success',
        description: 'Question deleted',
      });
      loadExam();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) return null;

  const totalPoints = exam.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
            <Badge variant={statusColors[exam.status] as any}>{exam.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {exam.subject?.name} • {exam.term?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {exam.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => router.push(`/lms/exams/${examId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handlePublish} disabled={submitting || (exam.questions?.length || 0) === 0}>
                <Upload className="mr-2 h-4 w-4" />
                Publish
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          {exam.status === 'PUBLISHED' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/lms/exams/${examId}/take`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Take Exam
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/lms/exams/${examId}/results`}>
                  <Users className="mr-2 h-4 w-4" />
                  Results
                </Link>
              </Button>
              <Button onClick={handleGrade} disabled={submitting}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Auto-Grade
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{exam.duration}</span>
              <span className="text-muted-foreground">min</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{exam.questions?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalPoints}</span>
              <span className="text-muted-foreground">pts</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Type</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {examTypeLabels[exam.examType] || exam.examType}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {exam.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{exam.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {exam.questions?.length || 0} questions • {totalPoints} total points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!exam.questions || exam.questions.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions yet</p>
              {exam.status === 'DRAFT' && (
                <Button className="mt-4" onClick={() => router.push(`/lms/exams/${examId}/edit`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Questions
                </Button>
              )}
            </div>
          ) : (
            exam.questions?.map((question, qIndex) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{qIndex + 1}</Badge>
                    <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {question.points} pt{question.points > 1 ? 's' : ''}
                    </span>
                  </div>
                  {exam.status === 'DRAFT' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <p className="font-medium mb-3">{question.content}</p>
                {question.type !== 'SHORT_ANSWER' && question.options && (
                  <div className="space-y-2">
                    {question.options
                      .sort((a, b) => a.order - b.order)
                      .map((option, oIndex) => (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            option.isCorrect ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                            option.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                          }`}>
                            {String.fromCharCode(65 + oIndex)}
                          </div>
                          <span className={option.isCorrect ? 'text-green-700 dark:text-green-300 font-medium' : ''}>
                            {option.content}
                          </span>
                          {option.isCorrect && (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
