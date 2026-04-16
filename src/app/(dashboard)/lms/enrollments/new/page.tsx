'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBranch } from '@/lib/hooks/use-branch';

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

export default function NewEnrollmentPage() {
  const router = useRouter();
  const { selectedBranch, isBranchMode } = useBranch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
  });

  useEffect(() => {
    // Load academic years with branch filter
    const params = new URLSearchParams();
    if (selectedBranch) {
      params.set('branchId', selectedBranch.id);
    }
    const url = '/api/sms/academic-years' + (params.toString() ? '?' + params.toString() : '');
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        const yearsList = Array.isArray(data) ? data : (data.data || []);
        setYears(yearsList);
        // Select active year or first year
        const activeYear = yearsList.find((y: any) => y.isActive);
        if (activeYear) {
          setSelectedYear(activeYear.id);
        } else if (yearsList.length > 0) {
          setSelectedYear(yearsList[0].id);
        }
      })
      .catch(err => console.error('Error loading years:', err));
  }, []);

  useEffect(() => {
    // Load students with branch filter
    const params = new URLSearchParams();
    if (selectedBranch) {
      params.set('branchId', selectedBranch.id);
    }
    const url = '/api/sms/students' + (params.toString() ? '?' + params.toString() : '');
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        const studentsList = Array.isArray(data) ? data : (data.data || []);
        setStudents(studentsList);
      })
      .catch(err => console.error('Error loading students:', err));
  }, [selectedBranch]);

  useEffect(() => {
    // Load classes when academic year is selected
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

      router.push('/lms/enrollments');
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
    </div>
  );
}
