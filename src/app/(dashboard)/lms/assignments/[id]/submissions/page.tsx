'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  CheckCircle, 
  Clock,
  Grade
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Submission {
  id: string;
  content: string | null;
  fileUrl: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string | null;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  points: number;
  dueDate: string | null;
  course: { name: string };
  _count: { submissions: number };
}

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assignmentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '', status: 'GRADED' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        authFetch(`/api/lms/assignments/${assignmentId}`),
        authFetch(`/api/lms/assignments/${assignmentId}/submit`),
      ]);

      if (assignmentRes.ok) {
        setAssignment(await assignmentRes.json());
      }
      if (submissionsRes.ok) {
        setSubmissions(await submissionsRes.json());
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    
    setSaving(true);
    try {
      const res = await authFetch(
        `/api/lms/assignments/${assignmentId}/submissions/${gradingSubmission.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: gradeData.grade ? parseFloat(gradeData.grade) : null,
            feedback: gradeData.feedback || null,
            status: gradeData.status,
          }),
        }
      );

      if (res.ok) {
        toast({ description: 'Grade saved successfully' });
        setGradingSubmission(null);
        loadData();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to save grade' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to save grade' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Graded</span>;
      case 'RETURNED':
        return <span className="flex items-center gap-1 text-blue-600"><FileText className="w-4 h-4" /> Returned</span>;
      default:
        return <span className="flex items-center gap-1 text-orange-600"><Clock className="w-4 h-4" /> Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lms/assignments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{assignment?.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{assignment?.course.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{assignment?.points}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg dark:text-white">
              {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date'}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{submissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {submissions.length === 0 ? (
        <Card className="dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Submissions</h2>
          {submissions.map((submission) => (
            <Card key={submission.id} className="dark:bg-gray-800">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium dark:text-white">
                      {submission.student.firstName} {submission.student.lastName}
                      {submission.student.admissionNumber && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          ({submission.student.admissionNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Submitted: {formatDate(submission.submittedAt)}
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                  <div className="text-right">
                    {submission.grade !== null && (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {submission.grade}/{assignment?.points}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setGradingSubmission(submission);
                        setGradeData({
                          grade: submission.grade?.toString() || '',
                          feedback: submission.feedback || '',
                          status: submission.status || 'GRADED',
                        });
                      }}
                      className="mt-2 dark:border-gray-600 dark:text-white"
                    >
                      <Grade className="w-4 h-4 mr-1" />
                      {submission.grade !== null ? 'Update Grade' : 'Grade'}
                    </Button>
                  </div>
                </div>
                {submission.content && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm dark:text-gray-200 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                )}
                {submission.feedback && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Feedback:</strong> {submission.feedback}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent className="max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Grade Submission</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGrade} className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">Grade (out of {assignment?.points})</Label>
              <Input
                type="number"
                min="0"
                max={assignment?.points}
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-200">Feedback</Label>
              <textarea
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
                rows={3}
                placeholder="Optional feedback for student..."
              />
            </div>
            <div>
              <Label className="dark:text-gray-200">Status</Label>
              <Select value={gradeData.status} onValueChange={(v) => setGradeData({ ...gradeData, status: v })}>
                <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  <SelectItem value="GRADED" className="dark:text-white">Graded</SelectItem>
                  <SelectItem value="RETURNED" className="dark:text-white">Returned</SelectItem>
                  <SelectItem value="SUBMITTED" className="dark:text-white">Needs Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradingSubmission(null)} className="dark:bg-gray-800 dark:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}