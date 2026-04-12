'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  specialty?: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await authFetch('/api/sms/teachers');
        if (!res.ok) {
          if (res.status === 401) {
            setError('Session expired. Please login again.');
          } else {
            setError('Failed to load teachers');
          }
          return;
        }
        const data = await res.json();
        // API returns array directly in 'teachers' or root array
        const teacherList = data.teachers || data;
        setTeachers(Array.isArray(teacherList) ? teacherList : []);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage teacher records</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teacher records</p>
        </div>
        <Link
          href="/sms/teachers/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Add Teacher
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Specialty</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No teachers yet. Add your first teacher to get started.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.employeeId || '-'}</td>
                  <td className="px-6 py-3">
                    <Link href={`/sms/teachers/${teacher.id}`} className="text-blue-600 hover:underline">
                      {teacher.firstName} {teacher.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.email || '-'}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.specialty || '-'}</td>
                  <td className="px-6 py-3">
                    <Link href={`/sms/teachers/${teacher.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}