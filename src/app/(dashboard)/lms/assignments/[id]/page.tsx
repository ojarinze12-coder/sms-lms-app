'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ArrowLeft, 
  Save, 
  Loader2, 
  Trash2, 
  Send,
  Upload,
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: string;
  points: number;
  dueDate: string | null;
  allowLate: boolean;
  latePenalty: number | null;
  allowFileUpload: boolean;
  maxFileSize: number | null;
  isPublished: boolean;
  subjectId: string | null;
  classId: string | null;
  academicClass: { id: string; name: string; level: number; stream: string | null } | null;
  subject: { id: string; name: string; code: string } | null;
  course: { id: string; name: string; code: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  _count: { submissions: number };
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

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'INDIVIDUAL',
    points: 100,
    dueDate: '',
    allowLate: true,
    latePenalty: 10,
    allowFileUpload: true,
    maxFileSize: 5,
    classId: '',
    subjectId: '',
  });

  const assignmentId = params.id as string;

  useEffect(() => {
    if (selectedBranch) {
      loadClasses();
      loadSubjects();
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

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

  const loadAssignment = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/lms/assignments/${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          instructions: data.instructions || '',
          type: data.type || 'INDIVIDUAL',
          points: data.points || 100,
          dueDate: data.dueDate ? data.dueDate.slice(0, 16) : '',
          allowLate: data.allowLate ?? true,
          latePenalty: data.latePenalty || 10,
          allowFileUpload: data.allowFileUpload ?? true,
          maxFileSize: data.maxFileSize || 5,
          classId: data.classId || '',
          subjectId: data.subjectId || '',
        });
      } else {
        toast({ variant: 'destructive', description: 'Failed to load assignment' });
        router.push('/lms/assignments');
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
      router.push('/lms/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/lms/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      });

      if (res.ok) {
        toast({ description: 'Assignment updated successfully' });
        setIsEditing(false);
        loadAssignment();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to update assignment' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to update assignment' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const res = await authFetch(`/api/lms/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ description: 'Assignment deleted' });
        router.push('/lms/assignments');
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to delete' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to delete assignment' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (publish: boolean) => {
    try {
      const res = await authFetch(`/api/lms/assignments/${assignmentId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: publish ? 'publish' : 'unpublish' }),
      });

      if (res.ok) {
        toast({ description: publish ? 'Assignment published' : 'Assignment unpublished' });
        loadAssignment();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to update assignment' });
    }
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const isPast = date < now;
    
    return (
      <span className={isPast ? 'text-red-500 dark:text-red-400' : ''}>
        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  const getStatusBadge = () => {
    if (!assignment) return null;
    if (assignment.isPublished) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Published</Badge>;
    }
    return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Draft</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold dark:text-white">{assignment.title}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {assignment.academicClass?.name} - {assignment.subject?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {!assignment.isPublished && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing}>
                <Save className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => handlePublish(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </>
          )}
          {assignment.isPublished && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/lms/assignments/${assignmentId}/submissions`}>
                  <Users className="w-4 h-4 mr-2" />
                  Submissions ({assignment._count.submissions})
                </Link>
              </Button>
              <Button variant="outline" onClick={() => handlePublish(false)}>
                <XCircle className="w-4 h-4 mr-2" />
                Unpublish
              </Button>
            </>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-2xl font-bold dark:text-white">{assignment.points}</span>
              <span className="text-gray-500 dark:text-gray-400">pts</span>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Due Date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="dark:text-white">{formatDueDate(assignment.dueDate)}</span>
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
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="dark:text-gray-400">Submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-2xl font-bold dark:text-white">{assignment._count.submissions}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {assignment.description || 'No description provided'}
          </p>
        </CardContent>
      </Card>

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

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Allow Late</span>
              <p className="font-medium dark:text-white">{assignment.allowLate ? 'Yes' : 'No'}</p>
            </div>
            {assignment.allowLate && assignment.latePenalty && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Late Penalty</span>
                <p className="font-medium dark:text-white">{assignment.latePenalty}% per day</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">File Upload</span>
              <p className="font-medium dark:text-white">{assignment.allowFileUpload ? 'Allowed' : 'Not Allowed'}</p>
            </div>
            {assignment.allowFileUpload && assignment.maxFileSize && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Max File Size</span>
                <p className="font-medium dark:text-white">{assignment.maxFileSize} MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                    {subjects.map((subject) => (
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

            <div>
              <Label className="dark:text-gray-200">Instructions</Label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
                rows={3}
                placeholder="Enter submission instructions..."
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
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
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

            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.allowLate}
                  onChange={(e) => setFormData({ ...formData, allowLate: e.target.checked })}
                />
                Allow Late
              </label>
              {formData.allowLate && (
                <div className="flex items-center gap-2">
                  <Label className="dark:text-gray-200">Penalty %</Label>
                  <Input
                    type="number"
                    value={formData.latePenalty}
                    onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) || 0 })}
                    className="w-20 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.allowFileUpload}
                  onChange={(e) => setFormData({ ...formData, allowFileUpload: e.target.checked })}
                />
                Allow File Upload
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="dark:bg-gray-800 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}