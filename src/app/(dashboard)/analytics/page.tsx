'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  GraduationCap,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    students: number;
    teachers: number;
    courses: number;
    exams: number;
    enrollments: number;
    classes: number;
  };
  fees: {
    totalGenerated: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    presentRate: number;
  };
  exams: {
    total: number;
    graded: number;
    passCount: number;
    passRate: number;
    averageScore: number;
  };
  recentExams: Array<{
    id: string;
    title: string;
    status: string;
    subject: { name: string };
  }>;
  topStudents: Array<{
    id: string;
    name: string;
    studentId: string;
    score: number;
  }>;
}

export default function AnalyticsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadAnalytics();
    }
  }, [authLoading, user]);

  async function loadAnalytics() {
    try {
      const res = await fetch('/api/sms/analytics');
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load analytics');
        return;
      }
      
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">School Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Overview of your school&apos;s performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                <p className="text-3xl font-bold dark:text-white">{analytics?.overview.students || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
                <p className="text-3xl font-bold dark:text-white">{analytics?.overview.teachers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Classes</p>
                <p className="text-3xl font-bold dark:text-white">{analytics?.overview.classes || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exams</p>
                <p className="text-3xl font-bold dark:text-white">{analytics?.overview.exams || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics?.attendance.presentRate || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics?.attendance.present || 0} of {analytics?.attendance.total || 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Fee Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics?.fees.collectionRate || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(analytics?.fees.totalCollected || 0)} collected
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Exam Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics?.exams.passRate || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics?.exams.passCount || 0} passed of {analytics?.exams.graded || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics?.exams.averageScore || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across all exams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Fees Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(analytics?.fees.totalGenerated || 0)}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(analytics?.fees.totalCollected || 0)}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(analytics?.fees.totalPending || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Top Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.recentExams && analytics.recentExams.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentExams.map((exam) => (
                  <div key={exam.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium dark:text-white">{exam.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{exam.subject?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      exam.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>{exam.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent exams</p>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Top Performing Students</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topStudents && analytics.topStudents.length > 0 ? (
              <div className="space-y-3">
                {analytics.topStudents.slice(0, 5).map((student, index) => (
                  <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-gray-50 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}>{index + 1}</span>
                      <div>
                        <p className="font-medium dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.studentId}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">{student.score?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No results yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
