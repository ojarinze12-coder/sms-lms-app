'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBranch } from '@/lib/hooks/use-branch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, UserPlus, Mail } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

interface ClassItem {
  id: string;
  name: string;
  level?: number;
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
  academicYearId?: string;
}

interface Credentials {
  username: string;
  password: string;
  email: string;
}

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { selectedBranch, isBranchMode } = useBranch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBranch) {
      params.set('branchId', selectedBranch.id);
    }
    const url = '/api/sms/academic-years' + (params.toString() ? '?' + params.toString() : '');
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        const yearsList = Array.isArray(data) ? data : (data.years || []);
        setYears(yearsList);
        const activeYear = yearsList.find((y: any) => y.isActive);
        if (activeYear) {
          setSelectedYear(activeYear.id);
        } else if (yearsList.length > 0) {
          setSelectedYear(yearsList[0].id);
        }
      })
      .catch(err => console.error('Error loading years:', err));
  }, [selectedBranch]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBranch) {
      params.set('branchId', selectedBranch.id);
    }
    const url = '/api/sms/students' + (params.toString() ? '?' + params.toString() : '');
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        const studentsList = data.students || [];
        console.log('Students loaded:', studentsList.length);
        setStudents(studentsList);
      })
      .catch(err => console.error('Error loading students:', err));
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedYear) {
      const params = new URLSearchParams();
      params.set('academicYearId', selectedYear);
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      authFetch(`/api/sms/academic-classes?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          console.log('Classes data:', data);
          const classesList = data?.data || [];
          setClasses(classesList);
        })
        .catch(err => console.error('Error loading classes:', err));
    }
  }, [selectedYear, selectedBranch]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/api/lms/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create enrollment');
        return;
      }

      // Show credentials dialog if user was created
      if (data.credentialsCreated && data.credentials) {
        setCredentials(data.credentials);
        setStudentEmail(data.enrollment?.student?.email || '');
        setShowCredentials(true);
      } else {
        router.push('/lms/enrollments');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/lms/enrollments"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Enrollments
        </Link>
        <h1 className="text-2xl font-bold mt-2 dark:text-white">Add New Enrollment</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select academic year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {students.length === 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm">
              Please create students first.
            </div>
          )}

          {classes.length === 0 && selectedYear && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm">
              No classes found for the selected academic year. Please create classes first.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class
            </label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select a class</option>
              {classes.map((cls) => {
                const fullClassName = cls.department 
                  ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                  : cls.stream 
                    ? `${cls.name}-${cls.stream}`
                    : cls.name;
                return (
                  <option key={cls.id} value={cls.id}>
                    {fullClassName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || students.length === 0 || classes.length === 0 || !selectedYear}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Enrollment'}
            </button>
            <Link
              href="/lms/enrollments"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <UserPlus className="h-5 w-5 text-green-600" />
              Student Account Created
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {studentEmail ? (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Credentials have been sent to {studentEmail}
                </span>
              ) : (
                'Copy the credentials below to share with the student.'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                    <p className="font-mono font-medium dark:text-white">{credentials.username}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(credentials.username, 'username')}
                    className="dark:border-gray-600 dark:text-gray-200"
                  >
                    {copiedField === 'username' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Password</p>
                    <p className="font-mono font-medium dark:text-white">{credentials.password}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="dark:border-gray-600 dark:text-gray-200"
                  >
                    {copiedField === 'password' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                <strong>Important:</strong> Advise the student to change their password after first login.
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCredentials(false)}
                  className="dark:border-gray-600 dark:text-gray-200"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowCredentials(false);
                    router.push('/lms/enrollments');
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}