'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Clock, 
  Calendar,
  ArrowLeft,
  Edit,
  Eye
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  creditHours: number;
  isPublished: boolean;
  enrollmentType: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
  order: number;
}

interface Enrollment {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'lessons' | 'students'>('details');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/lms/courses/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course || data);
        }
        
        const lessonsRes = await fetch(`/api/lms/lessons?courseId=${params.id}`);
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json();
          setLessons(Array.isArray(lessonsData) ? lessonsData : lessonsData.lessons || []);
        }
        
        const enrollRes = await fetch(`/api/lms/enrollments?courseId=${params.id}`);
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          setEnrollments(Array.isArray(enrollData) ? enrollData : enrollData.enrollments || []);
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCourse();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Course not found</p>
        <Link href="/lms/courses" className="text-blue-600 hover:underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/lms/courses"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/lms/courses/${course.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit Course
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-gray-500">{course.code}</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{course.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 -mb-px border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 -mb-px border-b-2 ${
                activeTab === 'lessons'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Lessons ({lessons.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 -mb-px border-b-2 ${
                activeTab === 'students'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Students ({enrollments.length})
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Credit Hours</p>
                      <p className="text-xl font-semibold">{course.creditHours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Enrollment Type</p>
                      <p className="text-xl font-semibold">{course.enrollmentType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'lessons' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lessons</CardTitle>
                  <Link
                    href={`/lms/lessons/new?courseId=${course.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Add Lesson
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No lessons yet</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span>{lesson.title}</span>
                          <Badge variant="outline">{lesson.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={lesson.isPublished ? 'default' : 'secondary'}>
                            {lesson.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Link
                            href={`/lms/lessons/${lesson.id}`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'students' && (
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{enrollment.student.studentId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {course.teacher?.firstName} {course.teacher?.lastName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Lessons</span>
                <span className="font-semibold">{lessons.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Enrolled Students</span>
                <span className="font-semibold">{enrollments.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
