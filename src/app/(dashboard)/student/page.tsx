'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Calendar, Bell, FileText, BookOpen, Clock, TrendingUp, AlertCircle, Table, Award, Download, ClipboardList, PlayCircle, Menu, X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface GradingScaleGrade {
  grade: string;
  minPercentage: number;
  remarks: string;
}

interface GradingScale {
  name: string;
  isDefault: boolean;
  grades: GradingScaleGrade[];
}

interface StudentData {
  student: { id: string; studentId: string; firstName: string; lastName: string; branchId?: string; academicClass: { id: string; name: string; level: number; stream?: string } | null };
  gradingScale: GradingScale | null;
  enrollments: Array<{ id: string; status: string; academicClass: { id: string; name: string; level: number; stream?: string; subjects?: Array<{ id: string; name: string; code: string }> } }>;
  results: Array<{ id: string; percentage: number; score: number; status: string; exam: { title: string; subject: { name: string }; term: { name: string; academicYear: { name: string } } } }>;
  reportCards: Array<{ id: string; totalScore: number; average: number; grade: string; term: { name: string; academicYear: { name: string } } }>;
  attendances: Array<{ id: string; date: string; status: string; remarks?: string }>;
  assignments: Array<{ id: string; status: string; grade?: number; assignment: { title: string; dueDate?: string } }>;
  announcements: Array<{ id: string; title: string; content: string; type: string; priority: string; createdAt: string }>;
  timetable: Array<{ id: string; dayOfWeek: number; period: number; subject: { name: string } }>;
  exams: Array<{ id: string; title: string; description?: string; duration: number; startTime: string; endTime: string; examType: string; subject?: { id: string; name: string; code: string }; term?: { id: string; name: string } }>;
}

const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
  if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
  if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
};

const getGradeFromScale = (percentage: number, gradingScale: GradingScale | null): { letter: string; pass: boolean } => {
  if (!gradingScale?.grades || gradingScale.grades.length === 0) {
    // Default fallback
    if (percentage >= 80) return { letter: 'A', pass: true };
    if (percentage >= 70) return { letter: 'B', pass: true };
    if (percentage >= 60) return { letter: 'C', pass: true };
    if (percentage >= 50) return { letter: 'D', pass: false };
    return { letter: 'F', pass: false };
  }
  
  const sortedGrades = [...gradingScale.grades].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const g of sortedGrades) {
    if (percentage >= g.minPercentage) {
      return { letter: g.grade, pass: g.minPercentage >= 50 };
    }
  }
  return { letter: 'F', pass: false };
};

const getMinPassingScore = (gradingScale: GradingScale | null): number => {
  if (!gradingScale?.grades || gradingScale.grades.length === 0) return 60;
  const passing = gradingScale.grades.find(g => g.remarks?.toLowerCase().includes('pass'));
  return passing?.minPercentage || 50;
};

// Default grading scale for display when none is configured
const defaultGradingScale: GradingScale = {
  name: 'Default',
  isDefault: true,
  grades: [
    { grade: 'A', minPercentage: 80, remarks: 'Excellent' },
    { grade: 'B', minPercentage: 70, remarks: 'Very Good' },
    { grade: 'C', minPercentage: 60, remarks: 'Good' },
    { grade: 'D', minPercentage: 50, remarks: 'Pass' },
    { grade: 'F', minPercentage: 0, remarks: 'Fail' },
  ]
};

export default function StudentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentData | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'courses' | 'results' | 'attendance' | 'assignments' | 'announcements' | 'timetable' | 'exams'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const res = await authFetch('/api/sms/students/portal');
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

  const stats = getAttendanceStats();
  const pendingAssignments = data?.assignments?.filter(a => a.status !== 'GRADED') || [];

  // Group results by term
  const resultsByTerm = useMemo(() => {
    if (!data?.results) return {};
    const grouped: Record<string, typeof data.results> = {};
    data.results.forEach(result => {
      const termName = result.exam?.term?.name || 'Unknown';
      if (!grouped[termName]) grouped[termName] = [];
      grouped[termName].push(result);
    });
    return grouped;
  }, [data?.results]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!data?.results || data.results.length === 0) {
      return { average: 0, highest: 0, lowest: 0, total: 0 };
    }
    const percentages = data.results.map(r => r.percentage);
    return {
      average: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      total: data.results.length
    };
  }, [data?.results]);

  // Grade distribution using the configured grading scale
  const activeGradingScale = data?.gradingScale || defaultGradingScale;
  const gradeDistribution = useMemo(() => {
    if (!data?.results) return {};
    const dist: Record<string, number> = {};
    data.results.forEach(r => {
      const { letter } = getGradeFromScale(r.percentage, activeGradingScale);
      dist[letter] = (dist[letter] || 0) + 1;
    });
    return dist;
  }, [data?.results, activeGradingScale]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">{error}</p>
          <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-2xl mx-auto mt-8"><div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300">Unable to load student data</div></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-4">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 md:p-6 text-white">
        <h1 className="text-lg md:text-2xl font-bold">Welcome, {data.student.firstName}!</h1>
        <p className="text-orange-100 text-sm">{data.student.academicClass?.name || 'Student Portal'} | ID: {data.student.studentId}</p>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'results', label: 'Results', icon: Award },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'assignments', label: 'Tasks', icon: FileText },
                { id: 'attendance', label: 'Attendance', icon: Calendar },
                { id: 'announcements', label: 'Notices', icon: Bell },
                { id: 'exams', label: 'Exams', icon: ClipboardList },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setViewMode(item.id as any); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg text-left transition-colors ${
                      viewMode === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden md:block overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'results', label: 'Results', icon: Award },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'assignments', label: 'Tasks', icon: FileText },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'announcements', label: 'Notices', icon: Bell },
            { id: 'exams', label: 'Exams', icon: ClipboardList },
          ].map(item => (
            <button key={item.id} onClick={() => setViewMode(item.id as any)} 
              className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                viewMode === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6">
            <CardHeader className="pb-2 px-0 pt-0"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Attendance</CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-4xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.percentage}%</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stats.present}/{stats.total} days</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6">
            <CardHeader className="pb-2 px-0 pt-0"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Average Score</CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-4xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{overallStats.average}%</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{overallStats.total} exams</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6">
            <CardHeader className="pb-2 px-0 pt-0"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Courses</CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-4xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{data.enrollments?.length || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enrolled</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Tab - Full Implementation */}
      {viewMode === 'results' && (
        <div className="space-y-6">
          {/* Grading Scale Info */}
          {data.gradingScale && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Using <span className="font-medium">{data.gradingScale.name}</span> grading scale
            </div>
          )}

          {/* Overall Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700 p-3 md:p-4">
              <CardHeader className="pb-1 md:pb-2 p-0"><CardTitle className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Average</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="text-xl md:text-2xl font-bold dark:text-white">{overallStats.average}%</div></CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700 p-3 md:p-4">
              <CardHeader className="pb-1 md:pb-2 p-0"><CardTitle className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Highest</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{overallStats.highest}%</div></CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700 p-3 md:p-4">
              <CardHeader className="pb-1 md:pb-2 p-0"><CardTitle className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Lowest</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{overallStats.lowest}%</div></CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700 p-3 md:p-4">
              <CardHeader className="pb-1 md:pb-2 p-0"><CardTitle className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="text-xl md:text-2xl font-bold dark:text-white">{overallStats.total}</div></CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader><CardTitle className="dark:text-white">Grade Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {Object.keys(gradeDistribution).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No results to display</p>
                ) : (
                  Object.entries(gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-t" style={{ height: `${Math.max((count / (overallStats.total || 1)) * 100, 5)}%` }}>
                        <span className="text-xs font-bold dark:text-white">{count}</span>
                      </div>
                      <span className="text-xs mt-1 dark:text-gray-400">{grade}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results by Term */}
          {Object.entries(resultsByTerm).map(([term, results]) => (
            <Card key={term} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white flex justify-between items-center">
                  <span>{term}</span>
                  <span className="text-sm font-normal text-gray-500">
                    Avg: {Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b dark:border-gray-700">
                      <tr>
                        <th className="text-left py-2 px-2 text-sm dark:text-gray-300">Exam</th>
                        <th className="text-left py-2 px-2 text-sm dark:text-gray-300">Subject</th>
                        <th className="text-left py-2 px-2 text-sm dark:text-gray-300">Score</th>
                        <th className="text-left py-2 px-2 text-sm dark:text-gray-300">Percentage</th>
                        <th className="text-left py-2 px-2 text-sm dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const minPass = getMinPassingScore(activeGradingScale);
                        const { letter, pass } = getGradeFromScale(result.percentage, activeGradingScale);
                        return (
                        <tr key={result.id} className="border-b dark:border-gray-700">
                          <td className="py-2 px-2 dark:text-white">{result.exam?.title}</td>
                          <td className="py-2 px-2 dark:text-gray-300">{result.exam?.subject?.name}</td>
                          <td className="py-2 px-2 dark:text-gray-300">{result.score}</td>
                          <td className="py-2 px-2 font-bold dark:text-white">{result.percentage.toFixed(1)}%</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${pass ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                              {letter} ({pass ? 'PASS' : 'FAIL'})
                            </span>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {data.results?.length === 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                No exam results available yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {viewMode === 'courses' && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader><CardTitle className="dark:text-white">My Courses</CardTitle></CardHeader>
          <CardContent>
            {data.enrollments?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No courses enrolled</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.enrollments.map(e => (
                  <div key={e.id} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-700/50">
                    <p className="font-medium dark:text-white">{e.academicClass?.name || 'Class'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Level {e.academicClass?.level}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      e.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignments Tab */}
      {viewMode === 'assignments' && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader><CardTitle className="dark:text-white">Tasks & Assignments</CardTitle></CardHeader>
          <CardContent>
            {data.assignments?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No tasks assigned</p>
            ) : (
              <div className="space-y-3">
                {data.assignments.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-lg dark:bg-gray-700/50">
                    <div>
                      <p className="font-medium dark:text-white">{a.assignment?.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due: {a.assignment?.dueDate || 'No deadline'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      a.status === 'GRADED' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Tab */}
      {viewMode === 'attendance' && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader><CardTitle className="dark:text-white">Attendance Records</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
                <div className="text-xs text-green-700 dark:text-green-300">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.total - stats.present}</div>
                <div className="text-xs text-red-700 dark:text-red-300">Absent</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">Late</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.percentage}%</div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Rate</div>
              </div>
            </div>
            {data.attendances?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No attendance records</p>
            ) : (
              <div className="space-y-2">
                {data.attendances.slice(0, 15).map(a => (
                  <div key={a.id} className="flex justify-between p-2 border dark:border-gray-700 rounded dark:bg-gray-700/50">
                    <span className="dark:text-gray-300">{new Date(a.date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Announcements Tab */}
      {viewMode === 'announcements' && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader><CardTitle className="dark:text-white">Announcements</CardTitle></CardHeader>
          <CardContent>
            {data.announcements?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No announcements</p>
            ) : (
              <div className="space-y-3">
                {data.announcements.map(a => (
                  <div key={a.id} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium dark:text-white">{a.title}</h4>
                      <div className="flex gap-2">
                        {a.priority === 'URGENT' && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded">URGENT</span>
                        )}
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded">{a.type}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exams Tab */}
      {viewMode === 'exams' && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Available Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.exams?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No exams currently available</p>
                <p className="text-sm mt-1">Exams will appear here when they are scheduled within your class time window.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.exams.map(exam => {
                  const startTime = new Date(exam.startTime);
                  const endTime = new Date(exam.endTime);
                  const isOngoing = startTime <= new Date() && endTime >= new Date();
                  const isUpcoming = startTime > new Date();
                  
                  return (
                    <div key={exam.id} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium dark:text-white text-lg">{exam.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {exam.subject?.name} ({exam.subject?.code})
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isOngoing 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}>
                            {isOngoing ? 'LIVE' : 'UPCOMING'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{exam.examType}</span>
                        </div>
                      </div>
                      
                      {exam.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{exam.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {exam.duration} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Start: </span>
                          <span>{startTime.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">End: </span>
                          <span>{endTime.toLocaleString()}</span>
                        </div>
                        {exam.term && (
                          <div>
                            <span className="text-gray-400">Term: </span>
                            <span>{exam.term.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {isOngoing && (
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          <PlayCircle className="h-5 w-5" />
                          Start Exam
                        </button>
                      )}
                      
                      {isUpcoming && (
                        <div className="w-full text-center px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg text-sm">
                          Exam not started yet. Come back when the scheduled time begins.
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
    </div>
  );
}