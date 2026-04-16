'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  BookOpen, 
  Plus,
  Search,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBranch } from '@/lib/hooks/use-branch';

interface Enrollment {
  id: string;
  status: string;
  grade: string | null;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  academicClass: {
    id: string;
    name: string;
    level: number;
    stream?: string | null;
    department?: { id: string; name: string; code: string } | null;
  };
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
}

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranch, isBranchMode } = useBranch();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    studentId: '',
    classId: '',
  });

  useEffect(() => {
    authFetchEnrollments();
    authFetchStudents();
    authFetchClasses();
  }, [selectedBranch]);

  async function authFetchEnrollments() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/lms/enrollments' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error('Failed to authFetch enrollments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function authFetchStudents() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/students' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data || []);
      }
    } catch (err) {
      console.error('Failed to authFetch students:', err);
    }
  }

  async function authFetchClasses() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/academic-classes' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to authFetch classes:', err);
    }
  }

  async function createEnrollment() {
    if (!newEnrollment.studentId || !newEnrollment.classId) {
      toast({ variant: 'destructive', description: 'Please select student and class' });
      return;
    }

    try {
      const res = await authFetch('/api/lms/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnrollment),
      });

      if (res.ok) {
        toast({ variant: 'default', description: 'Enrollment created successfully' });
        setShowAddDialog(false);
        setNewEnrollment({ studentId: '', classId: '' });
        authFetchEnrollments();
      } else {
        toast({ variant: 'destructive', description: 'Failed to create enrollment' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to create enrollment' });
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    DROPPED: 'bg-red-100 text-red-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Course Enrollments</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage student enrollments in courses and classes</p>
        </div>
        <Link href="/lms/enrollments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Enrollment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{enrollments.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{enrollments.filter(e => e.status === 'ACTIVE').length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{enrollments.filter(e => e.status === 'COMPLETED').length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{enrollments.filter(e => e.status === 'DROPPED').length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dropped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">All Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => {
                const cls = enrollment.academicClass;
                const fullClassName = cls?.department 
                  ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                  : cls?.stream 
                    ? `${cls.name}-${cls.stream}`
                    : cls?.name || '-';
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium dark:text-white">{enrollment.student?.studentId || '-'}</TableCell>
                    <TableCell className="dark:text-gray-300">{enrollment.student?.firstName} {enrollment.student?.lastName}</TableCell>
                    <TableCell className="dark:text-gray-300">{fullClassName}</TableCell>
                    <TableCell className="dark:text-gray-300">{enrollment.academicClass?.level || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[enrollment.status] || 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{enrollment.grade || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No enrollments yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
