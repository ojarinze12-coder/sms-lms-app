'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Calendar, FileText, Check, X, Eye, Mail, Phone, MapPin, UserPlus, PlayCircle } from 'lucide-react';
import { ExamDialog } from '@/components/admissions/ExamDialog';
import { InterviewDialog } from '@/components/admissions/InterviewDialog';
import { EnrollDialog } from '@/components/admissions/EnrollDialog';
import { ScoreDialog } from '@/components/admissions/ScoreDialog';

interface Application {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  applyingClassId: string;
  applyingClass?: { name: string };
  status: string;
  entranceExamScore?: number;
  entranceExamDate?: string;
  entranceExamLocation?: string;
  interviewScore?: number;
  interviewDate?: string;
  interviewLocation?: string;
  notes?: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    applyingClassId: '',
    jambRegNo: '',
    waecNo: '',
    previousSchool: '',
  });

  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);

  const [examSchedule, setExamSchedule] = useState({
    date: '',
    time: '',
    location: '',
    instructions: '',
  });

  const [interviewSchedule, setInterviewSchedule] = useState({
    date: '',
    time: '',
    location: '',
    instructions: '',
  });

  const [scores, setScores] = useState({
    entranceExamScore: '',
    interviewScore: '',
    notes: '',
  });

  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchClasses();
  }, [filterStatus]);

  async function fetchClasses() {
    try {
      const res = await authFetch('/api/sms/academic-classes');
      const response = await res.json();
      const classesData = response.data || response || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setClasses([]);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch(`/api/sms/applications?status=${filterStatus === 'all' ? '' : filterStatus}`);
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        applyingClassId: formData.applyingClassId || undefined,
      };
      console.log('[APPLICATIONS] Submitting:', submitData);
      const res = await authFetch('/api/sms/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      console.log('[APPLICATIONS] Response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[APPLICATIONS] Created:', data.id);
        setShowForm(false);
        fetchApplications();
        setFormData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'MALE', applyingClassId: '', jambRegNo: '', waecNo: '', previousSchool: '' });
      } else {
        const err = await res.json();
        console.error('[APPLICATIONS] Error:', err);
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    }
  }

  async function updateStatus(id: string, action: string, additionalData?: Record<string, any>) {
    let extraData = additionalData || {};
    
    if (!additionalData) {
      if (action === 'schedule_exam') {
        extraData = {
          entranceExamDate: examSchedule.date,
          entranceExamLocation: examSchedule.location,
          notes: `Exam scheduled for ${examSchedule.date} at ${examSchedule.location}. ${examSchedule.instructions}`,
        };
      } else if (action === 'schedule_interview') {
        extraData = {
          interviewDate: interviewSchedule.date,
          interviewLocation: interviewSchedule.location,
          notes: (selectedApp?.notes || '') + `\nInterview scheduled for ${interviewSchedule.date} at ${interviewSchedule.location}. ${interviewSchedule.instructions}`,
        };
      } else if (action === 'enter_scores') {
        extraData = {
          entranceExamScore: parseFloat(scores.entranceExamScore) || undefined,
          interviewScore: parseFloat(scores.interviewScore) || undefined,
          notes: scores.notes,
        };
      }
    }

    try {
      console.log('[UPDATE_STATUS] Action:', action, 'ID:', id, 'ExtraData:', extraData);
      const res = await authFetch('/api/sms/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action, ...extraData }),
      });
      const data = await res.json();
      console.log('[UPDATE_STATUS] Response:', res.status, 'Data:', data);
      if (res.ok) {
        alert('Status updated to ' + data.status);
        fetchApplications();
        setShowExamDialog(false);
        setShowInterviewDialog(false);
        setShowScoreDialog(false);
        setSelectedApp(null);
      } else {
        console.error('[UPDATE_STATUS] Error:', data);
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleEnroll(applicationId: string, classId: string) {
    try {
      const res = await fetch(`/api/sms/applications/${applicationId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentClassId: classId }),
      });
      
      if (res.ok) {
        fetchApplications();
        setShowEnrollDialog(false);
        setSelectedApp(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to enroll student');
      }
    } catch (err) {
      console.error('Failed to enroll:', err);
      alert('Failed to enroll student');
    }
  }

  async function handleStartReview(id: string) {
    try {
      await authFetch('/api/sms/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'review' }),
      });
      fetchApplications();
    } catch (err) {
      console.error('Failed to start review:', err);
    }
  }

  const statusOptions = [
    { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-500' },
    { value: 'REVIEWING', label: 'Under Review', color: 'bg-blue-500' },
    { value: 'ENTRANCE_EXAM', label: 'Scheduled for Exam', color: 'bg-purple-500' },
    { value: 'INTERVIEW', label: 'Scheduled for Interview', color: 'bg-indigo-500' },
    { value: 'APPROVED', label: 'Approved', color: 'bg-green-500' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
    { value: 'ENROLLED', label: 'Enrolled', color: 'bg-emerald-500' },
  ];

  const filteredApps = filterStatus === 'all' 
    ? applications 
    : applications.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Admissions Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage applications, schedule exams, and process admissions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Application'}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'REVIEWING', 'ENTRANCE_EXAM', 'INTERVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'].map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="dark:text-white">New Admission Application</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <Input type="date" placeholder="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
                <select className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <select className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white" value={formData.applyingClassId} onChange={e => setFormData({...formData, applyingClassId: e.target.value})}>
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Input placeholder="JAMB Reg No." value={formData.jambRegNo} onChange={e => setFormData({...formData, jambRegNo: e.target.value})} />
                <Input placeholder="WAEC No." value={formData.waecNo} onChange={e => setFormData({...formData, waecNo: e.target.value})} />
                <Input placeholder="Previous School" value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} className="md:col-span-2" />
              </div>
              <Button type="submit">Submit Application</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Applications ({filteredApps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredApps.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No applications found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">App No.</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Contact</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Class</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Exam</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Interview</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredApps.map(app => {
                    const statusInfo = statusOptions.find(s => s.value === app.status);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-mono dark:text-white">{app.applicationNo}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium dark:text-white">{app.firstName} {app.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{app.gender}, {app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString() : ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-gray-300">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {app.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-gray-300">{app.applyingClass?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {app.entranceExamScore !== null && app.entranceExamScore !== undefined ? (
                            <span className="font-semibold dark:text-white">{app.entranceExamScore}%</span>
                          ) : app.entranceExamDate ? (
                            <span className="text-purple-600 dark:text-purple-400">{new Date(app.entranceExamDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {app.interviewScore !== null && app.interviewScore !== undefined ? (
                            <span className="font-semibold dark:text-white">{app.interviewScore}%</span>
                          ) : app.interviewDate ? (
                            <span className="text-indigo-600 dark:text-indigo-400">{new Date(app.interviewDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusInfo?.color}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {app.status === 'PENDING' && (
                              <Button size="sm" onClick={() => handleStartReview(app.id)}>
                                <PlayCircle className="h-3 w-3" /> Start Review
                              </Button>
                            )}
                            {app.status === 'REVIEWING' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowExamDialog(true); }}>
                                  <Calendar className="h-3 w-3" /> Schedule Exam
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowInterviewDialog(true); }}>
                                  <Calendar className="h-3 w-3" /> Schedule Interview
                                </Button>
                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                                  <Check className="h-3 w-3" /> Direct Approve
                                </Button>
                              </>
                            )}
                            {app.status === 'ENTRANCE_EXAM' && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                                <FileText className="h-3 w-3" /> Enter Scores
                              </Button>
                            )}
                            {app.status === 'INTERVIEW' && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                                <FileText className="h-3 w-3" /> Enter Scores
                              </Button>
                            )}
                            {app.status === 'APPROVED' && (
                              <>
                                <Button size="sm" onClick={() => { setSelectedApp(app); setShowEnrollDialog(true); }}>
                                  <UserPlus className="h-3 w-3" /> Enroll Student
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                                  Update Notes
                                </Button>
                              </>
                            )}
                            {app.status === 'REJECTED' && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                                Update Notes
                              </Button>
                            )}
                            {app.status === 'ENROLLED' && (
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Enrolled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entrance Exams Scheduled Section */}
      {applications.filter(a => a.status === 'ENTRANCE_EXAM' && a.entranceExamDate).length > 0 && (
        <Card className="border-purple-200 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Scheduled Entrance Exams ({applications.filter(a => a.status === 'ENTRANCE_EXAM' && a.entranceExamDate).length})
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Applicants scheduled for entrance examination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50 dark:bg-purple-900/30">
                  <tr>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">App No.</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Applicant</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Class</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Exam Date</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Time</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Location</th>
                    <th className="text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800">
                  {applications.filter(a => a.status === 'ENTRANCE_EXAM' && a.entranceExamDate).map(app => (
                    <tr key={app.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
                      <td className="px-4 py-3 text-sm font-mono dark:text-white">{app.applicationNo}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium dark:text-white">{app.firstName} {app.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{app.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">{app.applyingClass?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        {app.entranceExamDate ? new Date(app.entranceExamDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">9:00 AM</td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">{app.entranceExamLocation || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowScoreDialog(true); }}>
                            <FileText className="h-3 w-3" /> Scores
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam Dialog Component */}
      <ExamDialog
        open={showExamDialog}
        onOpenChange={setShowExamDialog}
        application={selectedApp}
        onSchedule={(id, examData) => {
          updateStatus(id, 'schedule_exam', {
            entranceExamDate: examData.date,
            entranceExamLocation: examData.location,
            notes: `Exam scheduled for ${examData.date} at ${examData.location}. ${examData.instructions}`,
          });
        }}
      />

      {/* Score Dialog Component */}
      <ScoreDialog
        open={showScoreDialog}
        onOpenChange={setShowScoreDialog}
        application={selectedApp}
        onSaveScores={(id, scoreData) => {
          updateStatus(id, 'enter_scores', {
            entranceExamScore: parseFloat(scoreData.entranceExamScore) || undefined,
            interviewScore: parseFloat(scoreData.interviewScore) || undefined,
            notes: scoreData.notes,
          });
        }}
        onApprove={(id) => updateStatus(id, 'approve')}
        onReject={(id) => updateStatus(id, 'reject')}
      />

      {/* Interview Dialog Component */}
      <InterviewDialog
        open={showInterviewDialog}
        onOpenChange={setShowInterviewDialog}
        application={showInterviewDialog ? selectedApp : null}
        onSchedule={(id, interviewData) => {
          updateStatus(id, 'schedule_interview', {
            interviewDate: interviewData.date,
            interviewLocation: interviewData.location,
            notes: `Interview scheduled for ${interviewData.date} at ${interviewData.location}. ${interviewData.instructions}`,
          });
        }}
      />

      {/* Enroll Dialog Component */}
      <EnrollDialog
        open={showEnrollDialog}
        onOpenChange={setShowEnrollDialog}
        application={showEnrollDialog ? selectedApp : null}
        onEnroll={handleEnroll}
      />
    </div>
  );
}