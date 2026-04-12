'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

interface LMSStats {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  activeStudents: number;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  completionRate: number;
}

interface TopCourse {
  id: string;
  name: string;
  enrollments: number;
  completionRate: number;
}

interface TopStudent {
  id: string;
  name: string;
  email: string;
  avgScore: number;
  coursesCompleted: number;
}

export default function LMSReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LMSStats | null>(null);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const res = await authFetch(`/api/lms/reports?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTopCourses(data.topCourses || []);
        setTopStudents(data.topStudents || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">LMS Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Learning Management System analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white bg-white dark:bg-gray-800">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold dark:text-white">{stats?.totalCourses || 0}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{stats?.publishedCourses || 0} published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
                <p className="text-2xl font-bold dark:text-white">{stats?.activeStudents || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stats?.totalEnrollments || 0} total enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exams Completed</p>
                <p className="text-2xl font-bold dark:text-white">{stats?.completedExams || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">of {stats?.totalExams || 0} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
                <p className="text-2xl font-bold dark:text-white">{stats?.averageScore || 0}%</p>
                <p className="text-xs text-green-600 dark:text-green-400">{stats?.completionRate || 0}% completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Top Performing Courses</CardTitle>
            <CardDescription className="dark:text-gray-400">Courses with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No course data available</p>
            ) : (
              <div className="space-y-3">
                {topCourses.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{course.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{course.enrollments} students</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">{course.completionRate}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">completion</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Top Performing Students</CardTitle>
            <CardDescription className="dark:text-gray-400">Students with highest scores</CardDescription>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No student data available</p>
            ) : (
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">{student.avgScore}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{student.coursesCompleted} courses</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-white">Performance Overview</CardTitle>
          <CardDescription className="dark:text-gray-400">Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalCourses || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.activeStudents || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.averageScore || 0}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.completionRate || 0}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
