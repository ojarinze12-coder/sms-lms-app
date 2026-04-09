'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Table,
  FileText,
  BookOpen,
  Bell,
  Calendar
} from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  academicClass: {
    id: string;
    name: string;
    level: number;
    stream?: string | null;
    department?: { id: string; name: string; code: string } | null;
    subjects: Array<{
      id: string;
      name: string;
      code: string;
      teacher?: { firstName: string; lastName: string };
    }>;
  };
  course?: { id: string; name: string };
}

interface Result {
  id: string;
  score: number;
  percentage: number;
  status: string;
  exam: {
    id: string;
    title: string;
    subject: { name: string; code: string };
    term: { name: string; academic_years: { name: string } };
  };
}

interface ReportCard {
  id: string;
  totalScore: number;
  average: number;
  grade: string;
  term: {
    name: string;
    academic_years: { name: string };
  };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  remarks?: string;
}

interface Assignment {
  id: string;
  status: string;
  grade?: number;
  submittedAt?: string;
  assignment: {
    id: string;
    title: string;
    dueDate?: string;
    course?: { name: string };
    subject?: { name: string };
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
}

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  period: number;
  startTime: string | null;
  endTime: string | null;
  subject: { id: string; name: string; code: string };
  teacher: { firstName: string; lastName: string } | null;
}

export default function StudentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    student: { 
      id: string; 
      studentId: string; 
      firstName: string; 
      lastName: string; 
      email: string;
      class: { id: string; name: string; level: number } | null;
    };
    enrollments: Enrollment[];
    results: Result[];
    reportCards: ReportCard[];
    attendances: Attendance[];
    assignments: Assignment[];
    announcements: Announcement[];
    timetable: TimetableSlot[];
  } | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'courses' | 'results' | 'attendance' | 'assignments' | 'announcements' | 'timetable'>('overview');

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const res = await fetch('/api/sms/students/portal');
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load portal data');
        return;
      }
      
      setData(data);
    } catch (err) {
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700';
    if (grade === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getAttendanceColor = (status: string) => {
    if (status === 'PRESENT') return 'bg-green-100 text-green-700';
    if (status === 'ABSENT') return 'bg-red-100 text-red-700';
    if (status === 'LATE') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const calculateAttendanceStats = () => {
    if (!data?.attendances) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
    const total = data.attendances.length;
    const present = data.attendances.filter(a => a.status === 'PRESENT').length;
    const absent = data.attendances.filter(a => a.status === 'ABSENT').length;
    const late = data.attendances.filter(a => a.status === 'LATE').length;
    return { 
      present, 
      absent, 
      late, 
      total, 
      percentage: total > 0 ? Math.round((present / total) * 100) : 0 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats();
  const pendingAssignments = data?.assignments 
    ? data.assignments.filter(a => a.status !== 'GRADED' && new Date(a.assignment.dueDate || '') > new Date())
    : [];

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Unable to load student data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Welcome, {data.student.firstName}!</h1>
        <p className="text-orange-100 text-sm md:text-base">
          {data.student.class ? `${data.student.class.name}` : 'Student Portal'}
          {' | '}ID: {data.student.studentId}
        </p>
      </div>

      {/* Navigation - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
          <button onClick={() => setViewMode('overview')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'overview' ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            Overview
          </button>
          <button onClick={() => setViewMode('timetable')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'timetable' ? 'bg-indigo-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            Timetable
          </button>
          <button onClick={() => setViewMode('courses')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'courses' ? 'bg-purple-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            My Courses ({data.enrollments.length})
          </button>
          <button onClick={() => setViewMode('assignments')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'assignments' ? 'bg-blue-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            Assignments ({pendingAssignments.length})
          </button>
          <button onClick={() => setViewMode('attendance')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'attendance' ? 'bg-green-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            Attendance ({attendanceStats.percentage}%)
          </button>
          <button onClick={() => setViewMode('announcements')} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${viewMode === 'announcements' ? 'bg-red-500 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'}`}>
            Notices ({data.announcements.length})
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card className="p-3 md:p-4">
              <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm font-medium text-gray-500">Attendance Rate</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-green-600">{attendanceStats.percentage}%</div>
                <p className="text-xs text-gray-500 mt-1">{attendanceStats.present} of {attendanceStats.total} days present</p>
              </CardContent>
            </Card>
            <Card className="p-3 md:p-4">
              <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm font-medium text-gray-500">Pending Assignments</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{pendingAssignments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting submission</p>
              </CardContent>
            </Card>
            <Card className="p-3 md:p-4">
              <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm font-medium text-gray-500">Enrolled Courses</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-purple-600">{data.enrollments.length}</div>
                <p className="text-xs text-gray-500 mt-1">Active enrollments</p>
              </CardContent>
            </Card>
          </div>

          {pendingAssignments.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" /> Upcoming Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingAssignments.slice(0, 3).map((assign) => (
                    <div key={assign.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium">{assign.assignment.title}</p>
                        <p className="text-sm text-gray-500">{assign.assignment.course?.name || assign.assignment.subject?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600 font-medium">{assign.assignment.dueDate ? formatDate(assign.assignment.dueDate) : 'No due date'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Recent Announcements</CardTitle></CardHeader>
            <CardContent>
              {data.announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No announcements</p>
              ) : (
                <div className="space-y-3">
                  {data.announcements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{ann.title}</h4>
                        <span className="text-xs text-gray-500">{formatDate(ann.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> My Courses & Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No course enrollments found</p>
            ) : (
              <div className="space-y-6">
                {data.enrollments.map((enrollment) => {
                  const cls = enrollment.academicClass;
                  const fullClassName = cls?.department 
                    ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                    : cls?.stream 
                      ? `${cls.name}-${cls.stream}`
                      : cls?.name || 'General';
                  return (
                    <div key={enrollment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{fullClassName}</h3>
                          <p className="text-sm text-gray-500">Level {enrollment.academicClass?.level}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {enrollment.status}
                        </span>
                      </div>
                    {enrollment.academicClass?.subjects && enrollment.academicClass.subjects.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Subjects:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {enrollment.academicClass.subjects.map((subject) => (
                            <div key={subject.id} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{subject.name}</p>
                              <p className="text-xs text-gray-500">{subject.code}</p>
                              {subject.teacher && (
                                <p className="text-xs text-gray-400">{subject.teacher.firstName} {subject.teacher.lastName}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'assignments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> My Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Assignment</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Course</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Due Date</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignments.map((assign) => (
                      <tr key={assign.id} className="border-b">
                        <td className="py-3 px-2 font-medium whitespace-nowrap">{assign.assignment.title}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap">{assign.assignment.course?.name || assign.assignment.subject?.name || '-'}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap">{assign.assignment.dueDate ? formatDate(assign.assignment.dueDate) : '-'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                            assign.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                            assign.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            assign.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{assign.status}</span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          {assign.grade !== null && assign.grade !== undefined ? (
                            <span className="font-bold">{assign.grade}%</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> My Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                <p className="text-sm text-green-700">Present</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                <p className="text-sm text-red-700">Absent</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                <p className="text-sm text-yellow-700">Late</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</p>
                <p className="text-sm text-blue-700">Rate</p>
              </div>
            </div>
            {data.attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendances.map((att) => (
                      <tr key={att.id} className="border-b">
                        <td className="py-3 px-2 whitespace-nowrap">{formatDate(att.date)}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getAttendanceColor(att.status)}`}>{att.status}</span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600 whitespace-nowrap">{att.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> My Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exam results found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Exam</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Subject</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Term</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Score</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((result) => (
                      <tr key={result.id} className="border-b">
                        <td className="py-3 px-2 font-medium whitespace-nowrap">{result.exam?.title}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{result.exam?.subject?.name}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap">{result.exam?.term?.name}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="font-bold">{result.percentage?.toFixed(1)}%</span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${result.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{result.status}</span>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'announcements' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.announcements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No announcements</p>
            ) : (
              <div className="space-y-4">
                {data.announcements.map((ann) => (
                  <div key={ann.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{ann.title}</h4>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${ann.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{ann.priority}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{ann.type}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{ann.content}</p>
                    <p className="text-xs text-gray-400">{formatDate(ann.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'timetable' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" /> My Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data.timetable || data.timetable.length === 0) ? (
              <p className="text-gray-500 text-center py-8">No timetable available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Period</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Mon</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Tue</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Wed</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Thu</th>
                      <th className="py-2 px-3 text-left font-medium text-gray-600 whitespace-nowrap">Fri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                      const periodSlots = data.timetable?.filter(t => t.period === period) || [];
                      return (
                        <tr key={period} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 font-medium whitespace-nowrap">P{period}</td>
                          {[1, 2, 3, 4, 5].map((day) => {
                            const slot = periodSlots.find(s => s.dayOfWeek === day);
                            return (
                              <td key={day} className="py-3 px-2 min-w-[100px]">
                                {slot ? (
                                  <div className="text-sm">
                                    <p className="font-medium">{slot.subject.name}</p>
                                    <p className="text-gray-500 text-xs">{slot.subject.code}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
