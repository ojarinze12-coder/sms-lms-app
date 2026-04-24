'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { 
  ParentData, 
  LinkedChild, 
  FeePayment, 
  Attendance, 
  Announcement, 
  Result, 
  ReportCard 
} from '@/types/parent';
import { 
  calculateAttendanceStats, 
  calculateFeeStats,
  getGradeColor,
  formatDate 
} from '@/types/parent';
import LinkChildModal from '@/components/parent/LinkChildModal';
import ParentNav from '@/components/parent/ParentNav';
import OverviewTab from '@/components/parent/OverviewTab';
import FeesTab from '@/components/parent/FeesTab';
import AttendanceTab from '@/components/parent/AttendanceTab';
import AnnouncementsTab from '@/components/parent/AnnouncementsTab';
import { authFetch } from '@/lib/auth-fetch';

export default function ParentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParentData | null>(null);
  const [error, setError] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'results' | 'report-cards' | 'fees' | 'attendance' | 'announcements'>('overview');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('GUARDIAN');

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const res = await authFetch('/api/sms/parents');
      const data = await res.json();
      
      if (res.status === 401) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Failed to load portal data');
        return;
      }
      
      setData(data);
      if (data.children.length > 0) {
        setSelectedChildId(data.children[0].id);
      }
    } catch (err) {
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    setLinkError('');
    setLinkSuccess('');

    try {
      const res = await authFetch('/api/sms/parents/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, relationship })
      });
      const result = await res.json();

      if (!res.ok) {
        setLinkError(result.error || 'Failed to link student');
        return;
      }

      setLinkSuccess(result.message || 'Link request submitted successfully!');
      setStudentId('');
      setRelationship('GUARDIAN');
      setTimeout(() => {
        setStudentId('');
        setLinkSuccess('');
        loadPortalData();
      }, 3000);
    } catch (err) {
      setLinkError('An error occurred. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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

  if (!data || data.children.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-xl border p-8 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Welcome to Parent Portal</h2>
          <p className="text-gray-600 mb-4">
            No children are linked to your account. 
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your email: {data?.parent?.email}
          </p>
          
          <LinkChildModal
            studentId={studentId}
            relationship={relationship}
            linkError={linkError}
            linkSuccess={linkSuccess}
            linking={linking}
            onStudentIdChange={setStudentId}
            onRelationshipChange={setRelationship}
            onSubmit={handleLinkStudent}
          />
        </div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats(data.attendances);
  const feeStats = calculateFeeStats(data.fees);
  
  const approvedChildren = data.children.filter(c => c.approvalStatus === 'APPROVED');
  const pendingChildren = data.children.filter(c => c.approvalStatus === 'PENDING');

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Welcome, {data.parent.firstName} {data.parent.lastName}</h1>
        <p className="text-blue-100 text-sm">Parent Portal - Monitor your child&apos;s progress</p>
      </div>

      {/* Pending Approvals */}
      {pendingChildren.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              Pending Link Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{child.firstName} {child.lastName}</p>
                    <p className="text-sm text-gray-500">ID: {child.studentId}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    Pending Approval
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Selector */}
      {approvedChildren.length > 0 && (
        <div className="bg-white rounded-xl border p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viewing Profile For:
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {approvedChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} ({child.studentId}) {child.class ? `- ${child.class.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <LinkChildModal
              studentId={studentId}
              relationship={relationship}
              linkError={linkError}
              linkSuccess={linkSuccess}
              linking={linking}
              onStudentIdChange={setStudentId}
              onRelationshipChange={setRelationship}
              onSubmit={handleLinkStudent}
            />
          </div>
        </div>
      )}

      {/* Link Child Modal */}
      <LinkChildModal
        studentId={studentId}
        relationship={relationship}
        linkError={linkError}
        linkSuccess={linkSuccess}
        linking={linking}
        onStudentIdChange={setStudentId}
        onRelationshipChange={setRelationship}
        onSubmit={handleLinkStudent}
      />

      {/* Navigation */}
      <ParentNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        feeStats={feeStats}
        attendanceStats={attendanceStats}
        announcementsCount={data.announcements.length}
      />

      {/* Tab Content */}
      {viewMode === 'overview' && (
        <OverviewTab
          attendanceStats={attendanceStats}
          feeStats={feeStats}
          announcements={data.announcements}
          onViewFees={() => setViewMode('fees')}
          onViewResults={() => setViewMode('results')}
        />
      )}

      {viewMode === 'fees' && (
        <FeesTab fees={data.fees} feeStats={feeStats} />
      )}

      {viewMode === 'attendance' && (
        <AttendanceTab attendances={data.attendances} attendanceStats={attendanceStats} />
      )}

      {viewMode === 'announcements' && (
        <AnnouncementsTab announcements={data.announcements} />
      )}

      {viewMode === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Exam Results</CardTitle>
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
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${result.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {result.status}
                          </span>
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

      {viewMode === 'report-cards' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {data.reportCards.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No report cards found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Term</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Academic Year</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Total Score</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Average</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reportCards.map((card) => (
                      <tr key={card.id} className="border-b">
                        <td className="py-3 px-2 whitespace-nowrap">{card.term?.name}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap">{card.term?.academic_years?.name}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{card.totalScore?.toFixed(1)}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{card.average?.toFixed(1)}%</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getGradeColor(card.grade)}`}>
                            {card.grade}
                          </span>
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
    </div>
  );
}
