'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  thumbnail?: string;
  teacher?: { firstName: string; lastName: string };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    fetch('/api/lms/courses', { 
      credentials: 'include',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    })
      .then(res => {
        if (res.status === 401) {
          setError('Session expired. Please login again.');
          return { courses: [] };
        }
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setCourses(data.courses || []);
        // Check if user is teacher from the response
        setIsTeacher(data.isTeacher || false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('Failed to load courses');
        setLoading(false);
      });
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
            <h1 className="text-2xl font-bold dark:text-white">
              {isTeacher ? 'My Courses' : 'Courses'}
            </h1>
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
          <h1 className="text-2xl font-bold dark:text-white">
            {isTeacher ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isTeacher ? 'Your assigned courses' : 'Manage all courses'}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link 
              key={course.id} 
              href={`/lms/courses/${course.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {course.thumbnail && (
                <div className="h-40 bg-gray-200 dark:bg-gray-700">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold dark:text-white">{course.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>
                {course.teacher && (
                  <p className="text-sm text-gray-500 mt-2">
                    Teacher: {course.teacher.firstName} {course.teacher.lastName}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}