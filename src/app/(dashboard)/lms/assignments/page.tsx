'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Send,
  BookOpen,
  Check
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
  classId: string | null;
  subjectId: string | null;
  academicClass: { id: string; name: string; level: number; stream: string | null } | null;
  subject: { id: string; name: string; code: string } | null;
  _count: { submissions: number };
  submitted?: boolean;
  submissionStatus?: string | null;
  score?: number | null;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  stream: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function AssignmentsPage() {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const { user, role } = useAuth();
  const isTeacher = role === 'TEACHER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'INDIVIDUAL',
    points: '100',
    dueDate: '',
    allowLate: true,
    allowFileUpload: true,
    classId: '',
    subjectId: '',
  });

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      loadAssignments();
    }
  }, [selectedBranch, searchQuery, filterStatus, isTeacher, selectedClassId]);

  const loadClasses = async () => {
    try {
      const res = await authFetch('/api/lms/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || data || []);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await authFetch('/api/lms/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || data || []);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!isTeacher) {
        params.append('mySubmissions', 'true');
      }
      if (filterStatus !== 'all') {
        params.append('published', filterStatus === 'published' ? 'true' : 'false');
      }
      if (selectedClassId) {
        params.append('classId', selectedClassId);
      }
      
      const res = await authFetch(`/api/lms/assignments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await authFetch('/api/lms/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          points: parseInt(formData.points),
          dueDate: formData.dueDate || null,
        }),
      });

      if (res.ok) {
        toast({ description: 'Assignment created successfully' });
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          instructions: '',
          type: 'INDIVIDUAL',
          points: '100',
          dueDate: '',
          allowLate: true,
          allowFileUpload: true,
          classId: '',
          subjectId: '',
        });
        loadAssignments();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to create assignment' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to create assignment' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      const res = await authFetch(`/api/lms/assignments/${id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: publish ? 'publish' : 'unpublish' }),
      });

      if (res.ok) {
        toast({ description: publish ? 'Assignment published' : 'Assignment unpublished' });
        loadAssignments();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to update assignment' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const res = await authFetch(`/api/lms/assignments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ description: 'Assignment deleted' });
        loadAssignments();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to delete' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to delete assignment' });
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.isPublished) {
      return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Published</span>;
    }
    return <span className="flex items-center gap-1 text-gray-500"><XCircle className="w-4 h-4" /> Draft</span>;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const isPast = date < now;
    
    return (
      <span className={isPast ? 'text-red-500' : ''}>
        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            {isTeacher ? 'Assignments' : 'My Assignments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isTeacher ? 'Manage assignments for your courses' : 'View and submit your assignments'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={isTeacher ? "Search assignments..." : "Search your assignments..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
        {isTeacher && (
          <>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800">
                <SelectItem value="" className="dark:text-white">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="dark:text-white">
                    {cls.name} {cls.stream ? `(${cls.stream})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800">
                <SelectItem value="all" className="dark:text-white">All Status</SelectItem>
                <SelectItem value="published" className="dark:text-white">Published</SelectItem>
                <SelectItem value="draft" className="dark:text-white">Draft</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card className="dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isTeacher ? 'No assignments found' : 'No assignments available'}
            </p>
            {isTeacher && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Create First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="dark:bg-gray-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg dark:text-white">{assignment.title}</CardTitle>
                  {isTeacher ? (
                    getStatusBadge(assignment)
                  ) : (
                    assignment.submitted ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Submitted
                      </Badge>
                    ) : null
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assignment.academicClass?.name} - {assignment.subject?.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {assignment.points} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDueDate(assignment.dueDate)}
                  </span>
                </div>

                {isTeacher && assignment._count.submissions > 0 && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {assignment._count.submissions} submission(s)
                  </div>
                )}

                {!isTeacher && assignment.submitted && assignment.score !== null && (
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Score: {assignment.score}/{assignment.points}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {isTeacher ? (
                    <>
                      <Link href={`/lms/assignments/${assignment.id}/submissions`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-white">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePublish(assignment.id, !assignment.isPublished)}
                        className="dark:border-gray-600 dark:text-white"
                      >
                        {assignment.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Link href={`/lms/assignments/${assignment.id}/submit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-white">
                        {assignment.submitted ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Submit
                          </>
                        )}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create New Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-200">Class *</Label>
                <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v, subjectId: '' })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="dark:text-white">
                        {cls.name} {cls.stream ? `(${cls.stream})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-200">Subject *</Label>
                <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800">
                    {subjects
                      .filter(s => !formData.classId || true)
                      .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id} className="dark:text-white">
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="dark:text-gray-200">Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-200">Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800">
                    <SelectItem value="INDIVIDUAL" className="dark:text-white">Individual</SelectItem>
                    <SelectItem value="GROUP" className="dark:text-white">Group</SelectItem>
                    <SelectItem value="PROJECT" className="dark:text-white">Project</SelectItem>
                    <SelectItem value="QUIZ" className="dark:text-white">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-200">Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="dark:text-gray-200">Due Date</Label>
              <Input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.allowLate}
                  onChange={(e) => setFormData({ ...formData, allowLate: e.target.checked })}
                />
                Allow Late Submission
              </label>
              <label className="flex items-center gap-2 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.allowFileUpload}
                  onChange={(e) => setFormData({ ...formData, allowFileUpload: e.target.checked })}
                />
                Allow File Upload
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="dark:bg-gray-800 dark:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}