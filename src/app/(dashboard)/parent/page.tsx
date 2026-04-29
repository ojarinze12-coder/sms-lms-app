'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Menu, X, TrendingUp, CreditCard, Calendar, Bell, FileText, Award } from 'lucide-react';
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

const API_BASE = '/api/sms';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(API_BASE + '/parents', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const result = await res.json();
      
      if (res.status === 401) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(result.error || 'Failed to load portal data');
        return;
      }
      
      setData(result);
      if (result.children.length > 0) {
        setSelectedChildId(result.children[0].id);
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch(API_BASE + '/parents/link-student', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ studentId, relationship })
      });
      const result = await res.json();

      if (res.status === 201 && result.error?.includes('created')) {
        setLinkSuccess('Setting up your account...');
        const retryRes = await fetch(API_BASE + '/parents/link-student', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ studentId, relationship })
        });
        const retryResult = await retryRes.json();
        
        if (!retryRes.ok) {
          setLinkError(retryResult.error || 'Failed to link student');
          setLinking(false);
          return;
        }
        
        setLinkSuccess(retryResult.message || 'Student linked successfully!');
        setStudentId('');
        setRelationship('GUARDIAN');
        setTimeout(() => {
          setLinkSuccess('');
          loadPortalData();
        }, 3000);
        setLinking(false);
        return;
      }

      if (!res.ok) {
        setLinkError(result.error || 'Failed to link student');
        setLinking(false);
        return;
      }

      setLinkSuccess(result.message || 'Link request submitted successfully!');
      setStudentId('');
      setRelationship('GUARDIAN');
      setTimeout(() => {
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">{error}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Welcome to Parent Portal</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No children are linked to your account. 
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
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
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              Pending Link Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-white">{child.firstName} {child.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {child.studentId}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Viewing Profile For:
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
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

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg"
        onClick={() => setMobileMenuOpen(true)}
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
                { id: 'fees', label: 'Fees', icon: CreditCard, badge: feeStats.pending },
                { id: 'attendance', label: 'Attendance', icon: Calendar, badge: attendanceStats.percentage, isPercentage: true },
                { id: 'announcements', label: 'Notices', icon: Bell, badge: data.announcements.length },
                { id: 'results', label: 'Results', icon: FileText, badge: data.results.length },
                { id: 'report-cards', label: 'Report Cards', icon: Award, badge: data.reportCards.length },
              ].map(item => {
                const Icon = item.icon;
                const isPercentage = (item as any).isPercentage;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setViewMode(item.id as any); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors ${
                      viewMode === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {(item as any).badge !== undefined && (
                      <span className={`text-sm font-bold ${
                        viewMode === item.id ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {isPercentage ? `${(item as any).badge}%` : (item as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <ParentNav
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          feeStats={feeStats}
          attendanceStats={attendanceStats}
          announcementsCount={data.announcements.length}
          resultsCount={data.results.length}
          reportCardsCount={data.reportCards.length}
        />
      </div>

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
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">Exam Results</CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No exam results found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Exam</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Subject</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Term</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Score</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((result) => (
                      <tr key={result.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-2 font-medium whitespace-nowrap dark:text-white">{result.exam?.title}</td>
                        <td className="py-3 px-2 whitespace-nowrap dark:text-gray-300">{result.exam?.subject?.name}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap dark:text-gray-400">{result.exam?.term?.name}</td>
                        <td className="py-3 px-2 whitespace-nowrap dark:text-white">
                          <span className="font-bold">{result.percentage?.toFixed(1)}%</span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${result.status === 'GRADED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
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
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {data.reportCards.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No report cards found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Term</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Academic Year</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Total Score</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Average</th>
                      <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reportCards.map((card) => (
                      <tr key={card.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-2 whitespace-nowrap dark:text-gray-300">{card.term?.name}</td>
                        <td className="py-3 px-2 text-sm whitespace-nowrap dark:text-gray-400">{card.term?.academic_years?.name}</td>
                        <td className="py-3 px-2 whitespace-nowrap dark:text-white">{card.totalScore?.toFixed(1)}</td>
                        <td className="py-3 px-2 whitespace-nowrap dark:text-white">{card.average?.toFixed(1)}%</td>
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
