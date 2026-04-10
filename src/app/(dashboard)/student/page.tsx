'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Calendar, Bell, FileText, BookOpen, Clock, TrendingUp, AlertCircle, Table } from 'lucide-react';

interface StudentData {
  student: { id: string; studentId: string; firstName: string; lastName: string; class: { id: string; name: string; level: number } | null };
  enrollments: Array<{ id: string; status: string; academicClass: { id: string; name: string; level: number; stream?: string; subjects?: Array<{ id: string; name: string; code: string }> } }>;
  results: Array<{ id: string; percentage: number; status: string; exam: { title: string; subject: { name: string }; term: { name: string } } }>;
  attendances: Array<{ id: string; date: string; status: string; remarks?: string }>;
  assignments: Array<{ id: string; status: string; grade?: number; assignment: { title: string; dueDate?: string } }>;
  announcements: Array<{ id: string; title: string; content: string; type: string; priority: string; createdAt: string }>;
  timetable: Array<{ id: string; dayOfWeek: number; period: number; subject: { name: string } }>;
}

export default function StudentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentData | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'courses' | 'results' | 'attendance' | 'assignments' | 'announcements' | 'timetable'>('overview');

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const res = await fetch('/api/sms/students/portal', { credentials: 'include' });
      const result = await res.json();
      if (res.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }
      if (!res.ok) {
        setError(result.error || 'Failed to load portal data');
        return;
      }
      setData(result);
    } catch (err) {
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    if (!data?.attendances) return { present: 0, total: 0, percentage: 0 };
    const total = data.attendances.length;
    const present = data.attendances.filter(a => a.status === 'PRESENT').length;
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-2xl mx-auto mt-8"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Unable to load student data</div></div>;
  }

  const stats = getAttendanceStats();
  const pendingAssignments = data.assignments?.filter(a => a.status !== 'GRADED') || [];

  return (
    <div className="space-y-6 p-4">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {data.student.firstName}!</h1>
        <p className="text-orange-100">{data.student.class?.name || 'Student Portal'} | ID: {data.student.studentId}</p>
      </div>

      {/* Navigation */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'timetable', label: 'Timetable', icon: Table },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'announcements', label: 'Notices', icon: Bell },
          ].map(item => (
            <button key={item.id} onClick={() => setViewMode(item.id as any)} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${viewMode === item.id ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Attendance</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{stats.percentage}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Assignments</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{pendingAssignments.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Courses</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-purple-600">{data.enrollments?.length || 0}</div></CardContent></Card>
        </div>
      )}

      {viewMode === 'courses' && (
        <Card>
          <CardHeader><CardTitle>My Courses</CardTitle></CardHeader>
          <CardContent>
            {data.enrollments?.length === 0 ? <p className="text-gray-500">No courses</p> : (
              <div className="space-y-2">
                {data.enrollments.map(e => (
                  <div key={e.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{e.academicClass?.name || 'Class'}</p>
                    <p className="text-sm text-gray-500">Level {e.academicClass?.level}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'attendance' && (
        <Card>
          <CardHeader><CardTitle>Attendance</CardTitle></CardHeader>
          <CardContent>
            {data.attendances?.length === 0 ? <p className="text-gray-500">No records</p> : (
              <div className="space-y-2">
                {data.attendances.slice(0, 10).map(a => (
                  <div key={a.id} className="flex justify-between p-2 border rounded">
                    <span>{new Date(a.date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'PRESENT' ? 'bg-green-100' : 'bg-red-100'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'announcements' && (
        <Card>
          <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
          <CardContent>
            {data.announcements?.length === 0 ? <p className="text-gray-500">No announcements</p> : (
              <div className="space-y-2">
                {data.announcements.map(a => (
                  <div key={a.id} className="p-3 border rounded">
                    <h4 className="font-medium">{a.title}</h4>
                    <p className="text-sm text-gray-600">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'timetable' && (
        <Card>
          <CardHeader><CardTitle>Timetable</CardTitle></CardHeader>
          <CardContent>
            {data.timetable?.length === 0 ? <p className="text-gray-500">No timetable</p> : <p className="text-gray-500">Timetable view</p>}
          </CardContent>
        </Card>
      )}

      {viewMode === 'results' && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent>
            {data.results?.length === 0 ? <p className="text-gray-500">No results</p> : <p className="text-gray-500">Results view</p>}
          </CardContent>
        </Card>
      )}

      {viewMode === 'assignments' && (
        <Card>
          <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
          <CardContent>
            {data.assignments?.length === 0 ? <p className="text-gray-500">No assignments</p> : <p className="text-gray-500">Assignments view</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}