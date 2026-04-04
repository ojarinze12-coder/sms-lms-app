'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X, Clock, AlertCircle, Calendar, User, Phone, Mail, FileText, LogIn, UserPlus } from 'lucide-react';

interface ApplicationDetails {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  applyingClassId: string;
  applyingClass?: { name: string };
  academicYear?: { name: string };
  status: string;
  createdAt: string;
  entranceExamScore?: number;
  entranceExamDate?: string;
  entranceExamLocation?: string;
  interviewScore?: number;
  interviewDate?: string;
  interviewLocation?: string;
  notes?: string;
  documents?: { type: string; fileName: string }[];
}

interface ExamSchedule {
  date: string;
  time: string;
  location: string;
  instructions: string;
}

interface InterviewSchedule {
  date: string;
  time: string;
  location: string;
  instructions: string;
}

function StatusCheckForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAppNo = searchParams.get('app') || '';
  const tenantSlug = searchParams.get('school') || 'demo-school';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [appNo, setAppNo] = useState(initialAppNo);
  const [phone, setPhone] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [parentData, setParentData] = useState({ email: '', password: '', confirmPassword: '' });
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logo?: string } | null>(null);

  useEffect(() => {
    fetchSchoolInfo();
  }, [tenantSlug]);

  async function fetchSchoolInfo() {
    try {
      const res = await fetch(`/api/sms/applications/public?tenant=${tenantSlug}`);
      const data = await res.json();
      if (data.school) {
        setSchoolInfo(data.school);
      }
    } catch (err) {
      console.error('Failed to fetch school info:', err);
    }
  }

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/sms/applications/public?tenant=${tenantSlug}&applicationNo=${appNo}&phone=${phone}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Application not found');
        setApplication(null);
        return;
      }

      setApplication(data);
    } catch (err) {
      setError('Failed to check application status');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError('');
    setRegistering(true);

    if (parentData.password !== parentData.confirmPassword) {
      setRegisterError('Passwords do not match');
      setRegistering(false);
      return;
    }

    try {
      const res = await fetch('/api/sms/applications/register-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application?.id,
          email: parentData.email,
          password: parentData.password,
          phone: application?.phone,
          tenantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || 'Failed to register');
        return;
      }

      setRegisterSuccess(true);
      setTimeout(() => {
        router.push(`/login?school=${tenantSlug}`);
      }, 2000);
    } catch (err) {
      setRegisterError('Failed to register');
    } finally {
      setRegistering(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'REVIEWING': return 'bg-blue-500';
      case 'ENTRANCE_EXAM': return 'bg-purple-500';
      case 'INTERVIEW': return 'bg-indigo-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'ENROLLED': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  }

  const statusSteps = [
    { status: 'PENDING', label: 'Application Submitted', icon: FileText },
    { status: 'REVIEWING', label: 'Under Review', icon: User },
    { status: 'ENTRANCE_EXAM', label: 'Entrance Exam', icon: Calendar },
    { status: 'INTERVIEW', label: 'Interview', icon: User },
    { status: 'APPROVED', label: 'Approved', icon: Check },
    { status: 'ENROLLED', label: 'Enrolled', icon: Check },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === application?.status);
  if (application?.status === 'REJECTED') {
    // Show all steps up to rejected
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {schoolInfo && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{schoolInfo.name}</h1>
          )}
          <p className="text-xl text-gray-600">Check Application Status</p>
        </div>

        <Tabs value={showLoginForm ? 'login' : 'track'} onValueChange={(v) => setShowLoginForm(v === 'login')}>
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="track" className="flex-1">Track Application</TabsTrigger>
            <TabsTrigger value="login" className="flex-1">Parent Login</TabsTrigger>
          </TabsList>

          <TabsContent value="track">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={checkStatus} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appNo">Application Number</Label>
                      <Input
                        id="appNo"
                        value={appNo}
                        onChange={(e) => setAppNo(e.target.value)}
                        placeholder="e.g., APP-2026-00001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone used in application"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check Status
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Parent Portal Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you&apos;ve already created a parent account, login here to track your child&apos;s application.
                </p>
                <Button onClick={() => router.push(`/login?school=${tenantSlug}`)} className="w-full">
                  Go to Login Page
                </Button>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Don&apos;t have an account? Create one using your application details above.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {application && (
          <div className="space-y-6">
            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between overflow-x-auto">
                  {statusSteps.slice(0, application.status === 'REJECTED' ? 3 : application.status === 'ENROLLED' ? 6 : currentStepIndex + 2).map((step, index) => {
                    const isCompleted = index < currentStepIndex || application.status === 'ENROLLED' || application.status === 'APPROVED';
                    const isCurrent = step.status === application.status;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex flex-col items-center min-w-[100px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className={`text-xs mt-2 text-center ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                          {step.label}
                        </p>
                        {index < statusSteps.slice(0, application.status === 'REJECTED' ? 3 : currentStepIndex + 2).length - 1 && (
                          <div className={`absolute h-0.5 w-full top-5 left-1/2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} style={{ transform: 'translateY(-50%)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Application Details</span>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Application No.</p>
                    <p className="font-semibold">{application.applicationNo}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Applicant Name</p>
                    <p className="font-semibold">{application.firstName} {application.lastName}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Applied Class</p>
                    <p className="font-semibold">{application.applyingClass?.name || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Academic Year</p>
                    <p className="font-semibold">{application.academicYear?.name || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{application.email || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">{application.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Schedule */}
            {application.status === 'ENTRANCE_EXAM' && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Entrance Exam Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">{application.entranceExamDate ? new Date(application.entranceExamDate).toLocaleDateString() : 'To be announced'}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">9:00 AM</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg md:col-span-2">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{application.entranceExamLocation || 'School premises'}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Please arrive 30 minutes before the exam start time. Bring your application number and a valid ID.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Schedule */}
            {application.status === 'INTERVIEW' && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Interview Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">{application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : 'To be announced'}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">10:00 AM</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg md:col-span-2">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{application.interviewLocation || 'School Admin Office'}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Parent/Guardian must accompany the applicant. Bring relevant documents.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scores */}
            {(application.entranceExamScore !== null || application.interviewScore !== null) && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {application.entranceExamScore !== null && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Entrance Exam</p>
                        <p className="text-2xl font-bold">{application.entranceExamScore}%</p>
                      </div>
                    )}
                    {application.interviewScore !== null && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Interview</p>
                        <p className="text-2xl font-bold">{application.interviewScore}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {application.notes && (
              <Card>
                <CardContent className="pt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700">Notes from School:</p>
                    <p className="text-gray-600 mt-1">{application.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enrollment Success */}
            {application.status === 'ENROLLED' && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-800">Congratulations!</h2>
                  <p className="text-green-700 mt-2">
                    Your application has been approved and you have been enrolled.
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    Please visit the school to complete registration and collect your student&apos;s ID card.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Rejection */}
            {application.status === 'REJECTED' && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-800">Application Not Successful</h2>
                  <p className="text-red-700 mt-2">
                    We regret to inform you that your application was not successful this time.
                  </p>
                  {application.notes && (
                    <p className="text-sm text-gray-600 mt-4">
                      Reason: {application.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Register Parent Account */}
            {application.status !== 'ENROLLED' && application.status !== 'REJECTED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create Parent Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registerSuccess ? (
                    <div className="text-center py-4">
                      <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="font-semibold">Account Created Successfully!</p>
                      <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Create a parent account to receive updates about your application via email and SMS.
                      </p>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={parentData.email}
                          onChange={(e) => setParentData({ ...parentData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={parentData.password}
                          onChange={(e) => setParentData({ ...parentData, password: e.target.value })}
                          placeholder="Create password"
                          required
                        />
                      </div>
                      <div>
                        <Label>Confirm Password</Label>
                        <Input
                          type="password"
                          value={parentData.confirmPassword}
                          onChange={(e) => setParentData({ ...parentData, confirmPassword: e.target.value })}
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                      {registerError && (
                        <p className="text-red-500 text-sm">{registerError}</p>
                      )}
                      <Button type="submit" disabled={registering} className="w-full">
                        {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplyStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <StatusCheckForm />
    </Suspense>
  );
}