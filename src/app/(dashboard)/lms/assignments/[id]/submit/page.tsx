'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: string;
  points: number;
  dueDate: string | null;
  allowLate: boolean;
  allowFileUpload: boolean;
  isPublished: boolean;
  academicClass: { id: string; name: string; level: number; stream: string | null } | null;
  subject: { id: string; name: string; code: string } | null;
}

interface Submission {
  id: string;
  content: string | null;
  fileUrl: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string | null };
}

export default function SubmitAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');

  const assignmentId = params.id as string;

  useEffect(() => {
    if (!authLoading && role !== 'STUDENT') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only students can submit assignments.',
      });
      router.push('/lms/assignments');
    }
  }, [authLoading, role, router, toast]);

  useEffect(() => {
    if (assignmentId && !authLoading && role === 'STUDENT') {
      loadAssignmentAndSubmission();
    }
  }, [assignmentId, authLoading, role]);

  const loadAssignmentAndSubmission = async () => {
    setLoading(true);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        authFetch(`/api/lms/assignments/${assignmentId}`),
        authFetch(`/api/lms/assignments/${assignmentId}/submit`),
      ]);

      if (assignmentRes.ok) {
        const data = await assignmentRes.json();
        setAssignment(data);
      } else {
        toast({ variant: 'destructive', description: 'Assignment not found' });
        router.push('/lms/assignments');
        return;
      }

      if (submissionsRes.ok) {
        const submissions = await submissionsRes.json();
        if (submissions.length > 0) {
          setExistingSubmission(submissions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load:', err);
      toast({ variant: 'destructive', description: 'Failed to load assignment' });
      router.push('/lms/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ variant: 'destructive', description: 'Please enter your submission' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/lms/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        toast({ description: 'Assignment submitted successfully!' });
        loadAssignmentAndSubmission();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to submit' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to submit assignment' });
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDue = () => {
    if (!assignment?.dueDate) return false;
    return new Date() > new Date(assignment.dueDate);
  };

  const canSubmit = () => {
    if (!assignment?.isPublished) return false;
    if (existingSubmission) return false;
    if (isPastDue() && !assignment.allowLate) return false;
    return true;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{assignment.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {assignment.academicClass?.name} - {assignment.subject?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="text-2xl font-bold dark:text-white">{assignment.points}</span>
              <span className="text-gray-500">pts</span>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Due Date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${isPastDue() ? 'text-red-500' : 'text-gray-400'}`} />
              <span className={`dark:text-white ${isPastDue() ? 'text-red-500 dark:text-red-400' : ''}`}>
                {formatDueDate(assignment.dueDate)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Type</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="dark:text-white dark:border-gray-600">
              {assignment.type}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {assignment.description && (
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
          </CardContent>
        </Card>
      )}

      {assignment.instructions && (
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{assignment.instructions}</p>
          </CardContent>
        </Card>
      )}

      {existingSubmission ? (
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="dark:text-white">Your Submission</CardTitle>
              <Badge variant={existingSubmission.status === 'GRADED' ? 'default' : 'secondary'}>
                {existingSubmission.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="whitespace-pre-wrap dark:text-gray-200">{existingSubmission.content}</p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Submitted: {new Date(existingSubmission.submittedAt).toLocaleString()}
            </div>
            {existingSubmission.status === 'GRADED' && (
              <div className="border-t pt-4 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold dark:text-white">Graded: {existingSubmission.score}/{assignment.points}</span>
                </div>
                {existingSubmission.feedback && (
                  <div className="mt-2">
                    <p className="text-sm font-medium dark:text-gray-200">Feedback:</p>
                    <p className="text-gray-600 dark:text-gray-300">{existingSubmission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Submit Your Work</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {canSubmit() 
                ? 'Enter your answer or work below' 
                : isPastDue() && !assignment.allowLate 
                  ? 'The due date has passed and late submissions are not allowed'
                  : 'This assignment is not available for submission'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canSubmit() ? (
              <div className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[200px] dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Assignment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {isPastDue() && !assignment.allowLate 
                    ? 'Submission deadline has passed'
                    : !assignment.isPublished 
                      ? 'Assignment is not published yet'
                      : 'You have already submitted this assignment'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}