'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Loader2, Check, AlertCircle, Upload, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface SchoolInfo {
  name: string;
  slug: string;
  logo?: string | null;
  brandColor?: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: number;
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
}

interface AcademicYear {
  id: string;
  name: string;
}

function ApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('school') || 'demo-school';
  const { setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [applicationNo, setApplicationNo] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [brandColor, setBrandColor] = useState('#1a56db');
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [applicationFee, setApplicationFee] = useState(0);
  const [paymentGateway, setPaymentGateway] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [viewMode, setViewMode] = useState<'select' | 'new' | 'track'>('select');

  const [trackingAppNo, setTrackingAppNo] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    birthCertNo: '',
    previousSchool: '',
    previousClass: '',
    jambRegNo: '',
    waecNo: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: '',
    guardianAddress: '',
    applyingClassId: '',
    academicYearId: '',
  });

  const [documents, setDocuments] = useState<{ type: string; file: File | null }[]>([
    { type: 'BIRTH_CERT', file: null },
    { type: 'PREVIOUS_RESULT', file: null },
    { type: 'MEDICAL', file: null },
  ]);

  useEffect(() => {
    fetchSchoolInfo();
  }, [tenantSlug]);

  async function fetchSchoolInfo() {
    try {
      const res = await fetch(`/api/sms/applications/public?tenant=${tenantSlug}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSchoolInfo(data.school);
      setBrandColor(data.school?.brandColor || '#1a56db');
      setSchoolLogo(data.school?.logo || null);
      setClasses(data.classes || []);
      setAcademicYears(data.academicYears || []);
      setDeadline(data.deadline);
      setRequiresPayment(data.requiresPayment || false);
      setApplicationFee(data.applicationFee || 0);
      setPaymentGateway(data.paymentGateway || null);

      // Apply theme from tenant settings
      if (data.themeMode) {
        setTheme(data.themeMode.toLowerCase());
      }
    } catch (err) {
      setError('Failed to load school information');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(name: string, value: string) {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(index: number, file: File | null) {
    const newDocs = [...documents];
    newDocs[index].file = file;
    setDocuments(newDocs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formPayload = {
        ...formData,
        tenantSlug,
      };

      const res = await fetch('/api/sms/applications/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit application');
        return;
      }

      setApplicationNo(data.applicationNo);
      setApplicationId(data.id);

      if (requiresPayment && applicationFee > 0 && paymentGateway) {
        // Show payment section
        setSuccess(true);
      } else {
        // No payment needed - show final success
        setSuccess(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment() {
    if (!applicationId || !paymentGateway) return;
    
    setPaying(true);
    setPaymentError('');

    try {
      const res = await fetch('/api/sms/applications/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          gateway: paymentGateway,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || 'Failed to initialize payment');
        return;
      }

      // Redirect to payment page
      window.location.href = data.paymentUrl;
    } catch (err) {
      setPaymentError('Failed to process payment');
    } finally {
      setPaying(false);
    }
  }

  async function checkApplicationStatus(e: React.FormEvent) {
    e.preventDefault();
    setTrackingError('');
    setTrackingLoading(true);
    setTrackingResult(null);

    try {
      const res = await fetch(`/api/sms/applications/public?tenant=${tenantSlug}&applicationNo=${trackingAppNo}&phone=${trackingPhone}`);
      const data = await res.json();

      if (!res.ok) {
        setTrackingError(data.error || 'Application not found');
        return;
      }

      setTrackingResult(data);
    } catch (err) {
      setTrackingError('Failed to check application status');
    } finally {
      setTrackingLoading(false);
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

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
  ];

  const guardianRelations = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other'];
  const documentTypes = [
    { value: 'BIRTH_CERT', label: 'Birth Certificate' },
    { value: 'PREVIOUS_RESULT', label: 'Previous School Result' },
    { value: 'MEDICAL', label: 'Medical Record' },
    { value: 'TRANSFER_CERT', label: 'Transfer Certificate' },
    { value: 'OTHER', label: 'Other Document' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (error && !schoolInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6 text-center dark:text-gray-200">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 md:py-12 px-3 md:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            {schoolInfo && (
              <>
                {schoolLogo ? (
                  <div className="mb-4">
                    <img 
                      src={schoolLogo} 
                      alt={`${schoolInfo.name} logo`}
                      className="h-16 md:h-20 w-auto mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="h-12 w-12 md:h-16 md:w-16 rounded-lg flex items-center justify-center text-white font-bold text-xl md:text-2xl mx-auto mb-4"
                    style={{ backgroundColor: brandColor }}
                  >
                    {schoolInfo.name?.charAt(0) || 'S'}
                  </div>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ color: brandColor }}>
                  {schoolInfo.name}
                </h1>
              </>
            )}
            <p className="text-lg text-gray-600 dark:text-gray-300">Online Admissions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border-2 border-transparent hover:border-blue-500"
              onClick={() => setViewMode('new')}
            >
              <CardContent className="p-6 md:pt-8 md:pb-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Upload className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">New Application</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Start a new admission application for the upcoming academic year</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border-2 border-transparent hover:border-green-500"
              onClick={() => setViewMode('track')}
            >
              <CardContent className="p-6 md:pt-8 md:pb-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Check className="h-6 w-6 md:h-8 md:w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">Track Application</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Check the status of an existing application using your application number</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Already have a parent account? <a href={`/login?school=${tenantSlug}`} className="text-blue-600 hover:underline">Login</a>
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'track') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            {schoolInfo && (
              <>
                {schoolLogo ? (
                  <div className="mb-4">
                    <img 
                      src={schoolLogo} 
                      alt={`${schoolInfo.name} logo`}
                      className="h-16 w-auto mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                    style={{ backgroundColor: brandColor }}
                  >
                    {schoolInfo.name?.charAt(0) || 'S'}
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ color: brandColor }}>
                  {schoolInfo.name}
                </h1>
              </>
            )}
            <p className="text-lg text-gray-600 dark:text-gray-300">Track Application Status</p>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => { setViewMode('select'); setTrackingResult(null); }}
            className="mb-4"
          >
            ← Back to Options
          </Button>

          {!trackingResult ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <form onSubmit={checkApplicationStatus} className="space-y-4">
                  <div>
                    <Label className="dark:text-gray-200" htmlFor="trackingAppNo">Application Number</Label>
                    <Input
                      id="trackingAppNo"
                      value={trackingAppNo}
                      onChange={(e) => setTrackingAppNo(e.target.value)}
                      placeholder="e.g., APP-2026-00001"
                      required
                    />
                  </div>
                  <div>
                    <Label className="dark:text-gray-200" htmlFor="trackingPhone">Phone Number</Label>
                    <Input
                      id="trackingPhone"
                      value={trackingPhone}
                      onChange={(e) => setTrackingPhone(e.target.value)}
                      placeholder="Enter phone used in application"
                      required
                    />
                  </div>
                  {trackingError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-red-700 dark:text-red-400 text-sm">{trackingError}</p>
                    </div>
                  )}
                  <Button type="submit" disabled={trackingLoading} className="w-full" style={{ backgroundColor: brandColor }}>
                    {trackingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check Status
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between dark:text-white">
                    <span>Application Status</span>
                    <Badge className={getStatusColor(trackingResult.status)}>
                      {trackingResult.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Application No.</p>
                      <p className="font-semibold dark:text-white">{trackingResult.applicationNo}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Applicant Name</p>
                      <p className="font-semibold dark:text-white">{trackingResult.firstName} {trackingResult.lastName}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Applied Class</p>
                      <p className="font-semibold dark:text-white">{trackingResult.applyingClass?.name || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Academic Year</p>
                      <p className="font-semibold dark:text-white">{trackingResult.academicYear?.name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(trackingResult.status === 'ENTRANCE_EXAM' || trackingResult.status === 'INTERVIEW') && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                  <CardHeader>
                    <CardTitle className="dark:text-white">
                      {trackingResult.status === 'ENTRANCE_EXAM' ? 'Entrance Exam Schedule' : 'Interview Schedule'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                        <p className="font-semibold dark:text-white">
                          {trackingResult.entranceExamDate 
                            ? new Date(trackingResult.entranceExamDate).toLocaleDateString()
                            : trackingResult.interviewDate
                            ? new Date(trackingResult.interviewDate).toLocaleDateString()
                            : 'To be announced'}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                        <p className="font-semibold dark:text-white">
                          {trackingResult.entranceExamLocation || trackingResult.interviewLocation || 'School premises'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {trackingResult.entranceExamScore !== null && trackingResult.entranceExamScore !== undefined && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Assessment Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {trackingResult.entranceExamScore !== null && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Entrance Exam</p>
                          <p className="text-2xl font-bold dark:text-white">{trackingResult.entranceExamScore}%</p>
                        </div>
                      )}
                      {trackingResult.interviewScore !== null && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Interview</p>
                          <p className="text-2xl font-bold dark:text-white">{trackingResult.interviewScore}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {trackingResult.status === 'ENROLLED' && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="pt-6 text-center">
                    <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-green-800 dark:text-green-400">Congratulations!</h2>
                    <p className="text-green-700 dark:text-green-300 mt-2">
                      Your application has been approved and you have been enrolled.
                    </p>
                  </CardContent>
                </Card>
              )}

              {trackingResult.status === 'REJECTED' && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <CardContent className="pt-6 text-center">
                    <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 dark:text-red-400">Application Not Successful</h2>
                    <p className="text-red-700 dark:text-red-300 mt-2">
                      We regret to inform you that your application was not successful this time.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button 
                variant="outline" 
                onClick={() => { setTrackingResult(null); setTrackingAppNo(''); setTrackingPhone(''); }}
                className="w-full"
              >
                Check Another Application
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center dark:text-gray-200">
            {!requiresPayment || applicationFee <= 0 ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Your application has been successfully submitted.</p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Application Number</p>
                  <p className="text-2xl font-bold text-blue-600">{applicationNo}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-2">Application Number: <span className="font-bold text-blue-600">{applicationNo}</span></p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Application Fee</p>
                  <p className="text-2xl font-bold text-gray-900">₦{applicationFee.toLocaleString()}</p>
                </div>
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">{paymentError}</p>
                  </div>
                )}
                <Button 
                  onClick={handlePayment} 
                  disabled={paying}
                  className="w-full mb-3"
                  size="lg"
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ₦{applicationFee.toLocaleString()} with {paymentGateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'}</>
                  )}
                </Button>
              </>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please save this number to track your application status. You will also receive an SMS confirmation.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push(`/apply/status?school=${tenantSlug}&app=${applicationNo}`)} className="w-full">
                Check Application Status
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          {schoolInfo && (
            <>
              {schoolLogo ? (
                <div className="mb-4">
                  <img 
                    src={schoolLogo} 
                    alt={`${schoolInfo.name} logo`}
                    className="h-16 md:h-20 w-auto mx-auto object-contain"
                  />
                </div>
              ) : (
                <div 
                  className="h-12 w-12 md:h-16 md:w-16 rounded-lg flex items-center justify-center text-white font-bold text-xl md:text-2xl mx-auto mb-4"
                  style={{ backgroundColor: brandColor }}
                >
                  {schoolInfo.name?.charAt(0) || 'S'}
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ color: brandColor }}>
                {schoolInfo.name}
              </h1>
            </>
          )}
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">Online Admission Application</p>
          {deadline && (
            <Badge variant="outline" className="mt-2" style={{ borderColor: brandColor, color: brandColor }}>
              Deadline: {new Date(deadline).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 md:px-6">
              <CardTitle className="text-base md:text-lg dark:text-white">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                    <SelectTrigger className="h-11 md:h-10">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="e.g., 08012345678" className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="stateOfOrigin">State of Origin</Label>
                  <Select value={formData.stateOfOrigin} onValueChange={(v) => handleSelectChange('stateOfOrigin', v)}>
                    <SelectTrigger className="h-11 md:h-10">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigerianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="birthCertNo">Birth Certificate No.</Label>
                  <Input id="birthCertNo" name="birthCertNo" value={formData.birthCertNo} onChange={handleChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 md:px-6">
              <CardTitle className="text-base md:text-lg dark:text-white">Previous School Information</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="previousSchool">Previous School Name</Label>
                  <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="previousClass">Previous Class</Label>
                  <Input id="previousClass" name="previousClass" value={formData.previousClass} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="jambRegNo">JAMB Registration No. (SS3 only)</Label>
                  <Input id="jambRegNo" name="jambRegNo" value={formData.jambRegNo} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="waecNo">WAEC No. (SS3 only)</Label>
                  <Input id="waecNo" name="waecNo" value={formData.waecNo} onChange={handleChange} className="h-11 md:h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 md:px-6">
              <CardTitle className="text-base md:text-lg dark:text-white">Guardian/Parent Information</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="guardianName">Guardian Name *</Label>
                  <Input id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleChange} required className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="guardianPhone">Guardian Phone *</Label>
                  <Input id="guardianPhone" name="guardianPhone" type="tel" value={formData.guardianPhone} onChange={handleChange} required className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="guardianEmail">Guardian Email</Label>
                  <Input id="guardianEmail" name="guardianEmail" type="email" value={formData.guardianEmail} onChange={handleChange} className="h-11 md:h-10" />
                </div>
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="guardianRelation">Relationship *</Label>
                  <Select value={formData.guardianRelation} onValueChange={(v) => handleSelectChange('guardianRelation', v)}>
                    <SelectTrigger className="h-11 md:h-10">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {guardianRelations.map(rel => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="dark:text-gray-200 text-sm" htmlFor="guardianAddress">Guardian Address</Label>
                  <Input id="guardianAddress" name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} className="h-11 md:h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 md:mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 md:px-6">
              <CardTitle className="text-base md:text-lg dark:text-white">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="dark:text-gray-200 text-sm" htmlFor="applyingClassId">Applying for Class *</Label>
                  <Select value={formData.applyingClassId} onValueChange={(v) => handleSelectChange('applyingClassId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => {
                        const fullClassName = cls.department 
                          ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                          : cls.stream 
                            ? `${cls.name}-${cls.stream}`
                            : cls.name;
                        return (
                          <SelectItem key={cls.id} value={cls.id}>{fullClassName}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dark:text-gray-200" htmlFor="academicYearId">Academic Year *</Label>
                  <Select value={formData.academicYearId} onValueChange={(v) => handleSelectChange('academicYearId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map(year => (
                        <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Documents (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label>{documentTypes.find(d => d.value === doc.type)?.label}</Label>
                      {doc.file && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleFileChange(index, null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {doc.file ? (
                      <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{doc.file.name}</span>
                      </div>
                    ) : (
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                      />
                    )}
</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center px-3">
          <Button type="submit" disabled={submitting} className="w-full h-12 md:h-10 md:px-8" style={{ backgroundColor: brandColor }}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account? <a href={`/login?school=${tenantSlug}`} className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ApplicationForm />
    </Suspense>
  );
}