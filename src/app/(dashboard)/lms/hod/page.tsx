'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authFetch } from '@/lib/auth-fetch';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  FileX, 
  Clock, 
  BookOpen, 
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Eye
} from 'lucide-react';

interface ExamReview {
  id: string;
  title: string;
  examType: string;
  status: string;
  reviewStatus: string;
  subjectName: string;
  teacherName: string;
  questionsCount: number;
  createdAt: string;
}

export default function HODDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && role !== 'HOD') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only HODs can access this page.',
      });
      router.push('/lms/exams');
    }
  }, [authLoading, role, router, toast]);

  useEffect(() => {
    if (role === 'HOD') {
      loadPendingExams();
    }
  }, [role]);

  const loadPendingExams = async () => {
    try {
      const res = await authFetch('/api/lms/exams?reviewStatus=PENDING_REVIEW');
      const data = await res.json();
      setExams(data || []);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (examId: string, action: 'APPROVE' | 'REJECT') => {
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/lms/exams/${examId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: action === 'APPROVE' ? 'Exam Approved' : 'Exam Rejected',
          description: action === 'APPROVE' 
            ? 'Exam has been published for students.' 
            : 'Exam has been sent back for revision.',
        });
        loadPendingExams();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to review exam',
        });
      }
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || role !== 'HOD') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">HOD Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and approve exam submissions</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/lms/exams')}>
          <BookOpen className="mr-2 h-4 w-4" />
          All Exams
        </Button>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Reviews
          </CardTitle>
          <CardDescription>
            Exams waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No exams pending review</p>
              <p className="text-sm">All exams have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div 
                  key={exam.id} 
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium dark:text-white">{exam.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exam.subjectName} • {exam.examType}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {exam.teacherName}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {exam.questionsCount} questions
                        </span>
                      </div>
                    </div>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/lms/exams/${exam.id}`)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={() => handleReview(exam.id, 'APPROVE')}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReview(exam.id, 'REJECT')}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileX className="mr-1 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold dark:text-white">{exams.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Approved Today</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Rejected Today</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}