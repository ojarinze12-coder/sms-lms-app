'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, Download, Eye, Check, X, Users, UserCheck, UserCog, Fingerprint, Scan, Camera, Upload } from 'lucide-react';
import { FingerprintCapture } from '@/components/fingerprint-capture';
import { PhotoCapture } from '@/components/photo-capture';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photo?: string;
  cardStatus: string;
  cardIssuedAt?: string;
  cardExpiresAt?: string;
  barcode?: string;
  biometricId?: string;
}

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  photo?: string;
  cardStatus: string;
  cardIssuedAt?: string;
  cardExpiresAt?: string;
  barcode?: string;
  biometricId?: string;
}

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  category: string;
  photo?: string;
  cardStatus: string;
  cardIssuedAt?: string;
  cardExpiresAt?: string;
  barcode?: string;
  biometricId?: string;
}

interface IDCardData {
  type: string;
  id: string;
  studentId?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  photo?: string;
  barcode: string;
  cardIssuedAt: string;
  cardExpiresAt: string;
  tenantName: string;
  tenantLogo?: string;
  qrCodeDataURL: string;
}

export default function IDCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'staff'>('students');
  const [selectedCard, setSelectedCard] = useState<IDCardData | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showPhotoCaptureDialog, setShowPhotoCaptureDialog] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedPersonType, setSelectedPersonType] = useState<'student' | 'teacher' | 'staff'>('student');
  const [validityYears, setValidityYears] = useState('1');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsRes, teachersRes, staffRes] = await Promise.all([
        fetch('/api/sms/id-cards?type=student'),
        fetch('/api/sms/id-cards?type=teacher'),
        fetch('/api/sms/id-cards?type=staff'),
      ]);
      
      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();
      const staffData = await staffRes.json();
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error('Failed to fetch ID card data:', err);
      setStudents([]);
      setTeachers([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueCard(type: 'student' | 'teacher' | 'staff') {
    try {
      const res = await fetch('/api/sms/id-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [`${type}Id`]: selectedPersonId,
          validityYears: parseInt(validityYears),
        }),
      });

      if (res.ok) {
        setShowIssueDialog(false);
        setSelectedPersonId('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to issue card:', err);
    }
  }

  async function viewCard(id: string, type: 'student' | 'teacher' | 'staff') {
    try {
      const res = await fetch(`/api/sms/id-cards/${id}?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCard(data);
      }
    } catch (err) {
      console.error('Failed to fetch card:', err);
    }
  }

  async function revokeCard(id: string, type: 'student' | 'teacher' | 'staff') {
    if (!confirm('Are you sure you want to revoke this ID card?')) return;
    
    try {
      let endpoint = '';
      if (type === 'student') endpoint = `/api/sms/students/${id}`;
      else if (type === 'teacher') endpoint = `/api/sms/teachers/${id}`;
      else endpoint = `/api/sms/staff/${id}`;

      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardStatus: 'REVOKED' }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to revoke card:', err);
    }
  }

  async function enrollBiometric(id: string, type: 'student' | 'teacher' | 'staff') {
    setSelectedPersonId(id);
    setSelectedPersonType(type);
    setShowBiometricDialog(true);
  }

  async function handleBiometricCapture(fingerprintData: string) {
    try {
      await fetch('/api/sms/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [`${selectedPersonType}Id`]: selectedPersonId,
          biometricType: 'FINGERPRINT',
          biometricData: fingerprintData,
        }),
      });
      setShowBiometricDialog(false);
      setSelectedPersonId('');
      fetchData();
    } catch (err) {
      console.error('Failed to enroll biometric:', err);
    }
  }

  function capturePhoto(id: string, type: 'student' | 'teacher' | 'staff') {
    setSelectedPersonId(id);
    setSelectedPersonType(type);
    setCapturedPhoto(null);
    setShowPhotoCaptureDialog(true);
  }

  async function handlePhotoCapture(photoData: string) {
    try {
      let endpoint = '';
      if (selectedPersonType === 'student') endpoint = `/api/sms/students/${selectedPersonId}`;
      else if (selectedPersonType === 'teacher') endpoint = `/api/sms/teachers/${selectedPersonId}`;
      else endpoint = `/api/sms/staff/${selectedPersonId}`;

      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoData }),
      });
      setShowPhotoCaptureDialog(false);
      setSelectedPersonId('');
      fetchData();
    } catch (err) {
      console.error('Failed to update photo:', err);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Issued</Badge>;
      case 'NOT_ISSUED': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Not Issued</Badge>;
      case 'EXPIRED': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Expired</Badge>;
      case 'REVOKED': return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Revoked</Badge>;
      default: return <Badge className="dark:bg-gray-700 dark:text-gray-300">{status}</Badge>;
    }
  };

  const getNotIssuedList = () => {
    if (activeTab === 'students') return students.filter(s => s.cardStatus === 'NOT_ISSUED');
    if (activeTab === 'teachers') return teachers.filter(t => t.cardStatus === 'NOT_ISSUED');
    return staff.filter(s => s.cardStatus === 'NOT_ISSUED');
  };

  const getIssuedList = () => {
    if (activeTab === 'students') return students.filter(s => s.cardStatus === 'ISSUED');
    if (activeTab === 'teachers') return teachers.filter(t => t.cardStatus === 'ISSUED');
    return staff.filter(s => s.cardStatus === 'ISSUED');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Cards</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage student and staff identification cards</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Teachers
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" /> Staff
          </TabsTrigger>
        </TabsList>

        {(['students', 'teachers', 'staff'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold dark:text-white">
                    {tab === 'students' ? students.length : tab === 'teachers' ? teachers.length : staff.length}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {tab === 'students' ? students.filter(s => s.cardStatus === 'ISSUED').length :
                     tab === 'teachers' ? teachers.filter(t => t.cardStatus === 'ISSUED').length :
                     staff.filter(s => s.cardStatus === 'ISSUED').length}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cards Issued</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {tab === 'students' ? students.filter(s => s.cardStatus === 'NOT_ISSUED').length :
                     tab === 'teachers' ? teachers.filter(t => t.cardStatus === 'NOT_ISSUED').length :
                     staff.filter(s => s.cardStatus === 'NOT_ISSUED').length}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Not Issued</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {tab === 'students' ? students.filter(s => s.biometricId).length :
                     tab === 'teachers' ? teachers.filter(t => t.biometricId).length :
                     staff.filter(s => s.biometricId).length}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Biometric Enrolled</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize dark:text-white">{tab}</CardTitle>
                <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Issue New Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Issue ID Card</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-300">Select {tab === 'students' ? 'Student' : tab === 'teachers' ? 'Teacher' : 'Staff'}</Label>
                        <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue placeholder="Select person" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {getNotIssuedList().map((p: any) => (
                              <SelectItem key={p.id} value={p.id} className="dark:text-gray-300">
                                {p.firstName} {p.lastName} ({p.studentId || p.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Validity (Years)</Label>
                        <Select value={validityYears} onValueChange={setValidityYears}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="1" className="dark:text-gray-300">1 Year</SelectItem>
                            <SelectItem value="2" className="dark:text-gray-300">2 Years</SelectItem>
                            <SelectItem value="3" className="dark:text-gray-300">3 Years</SelectItem>
                            <SelectItem value="4" className="dark:text-gray-300">4 Years</SelectItem>
                            <SelectItem value="5" className="dark:text-gray-300">5 Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => handleIssueCard(tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'staff')} className="w-full">
                        Issue Card
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">ID</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Biometric</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Issued</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Expires</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {(tab === 'students' ? students : tab === 'teachers' ? teachers : staff).map((person: any) => (
                        <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                {person.photo ? (
                                  <img src={person.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium dark:text-white">{person.firstName[0]}{person.lastName[0]}</span>
                                )}
                              </div>
                              <span className="font-medium dark:text-white">{person.firstName} {person.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm dark:text-white">{person.studentId || person.employeeId}</td>
                          <td className="px-4 py-3">{getStatusBadge(person.cardStatus)}</td>
                          <td className="px-4 py-3">
                            {person.biometricId ? (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 flex items-center gap-1 w-fit">
                                <Fingerprint className="h-3 w-3" /> Enrolled
                              </Badge>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => enrollBiometric(person.id, tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'staff')}>
                                <Scan className="h-3 w-3 mr-1" /> Enroll
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {person.cardIssuedAt ? new Date(person.cardIssuedAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {person.cardExpiresAt ? new Date(person.cardExpiresAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => capturePhoto(person.id, tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'staff')} title="Capture Photo">
                                <Camera className="h-4 w-4" />
                              </Button>
                              {person.cardStatus === 'ISSUED' ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => viewCard(person.id, tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'staff')}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => revokeCard(person.id, tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'staff')}>
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => {
                                  setSelectedPersonId(person.id);
                                  setShowIssueDialog(true);
                                }}>
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* ID Card Preview Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">ID Card Preview</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden">
              {/* ID Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80">{selectedCard.tenantName}</p>
                    <p className="text-lg font-bold">{selectedCard.type}</p>
                  </div>
                  {selectedCard.tenantLogo && (
                    <img src={selectedCard.tenantLogo} alt="Logo" className="h-10 w-10 rounded bg-white" />
                  )}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-700">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                    {selectedCard.photo ? (
                      <img src={selectedCard.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">{selectedCard.firstName[0]}{selectedCard.lastName[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold dark:text-white">{selectedCard.firstName} {selectedCard.lastName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCard.studentId || selectedCard.employeeId}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valid until: {selectedCard.cardExpiresAt ? new Date(selectedCard.cardExpiresAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  {selectedCard.qrCodeDataURL && (
                    <img src={selectedCard.qrCodeDataURL} alt="QR Code" className="h-32 w-32" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-mono">{selectedCard.barcode}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Biometric Enrollment Dialog */}
      <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Enroll Fingerprint Biometric</DialogTitle>
          </DialogHeader>
          <FingerprintCapture 
            onCapture={handleBiometricCapture} 
            onCancel={() => setShowBiometricDialog(false)}
            mode="enroll"
          />
        </DialogContent>
      </Dialog>

      {/* Photo Capture Dialog */}
      <Dialog open={showPhotoCaptureDialog} onOpenChange={setShowPhotoCaptureDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Capture Photo</DialogTitle>
          </DialogHeader>
          <PhotoCapture
            value={capturedPhoto || ''}
            onChange={setCapturedPhoto}
          />
          {capturedPhoto && (
            <Button className="w-full mt-2" onClick={() => handlePhotoCapture(capturedPhoto)}>
              Save Photo
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}