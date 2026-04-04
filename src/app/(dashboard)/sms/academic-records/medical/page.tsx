'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Syringe, FileText, Calendar, AlertTriangle, Search, User, Heart, Activity } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface MedicalRecord {
  id: string;
  studentId: string;
  visitDate: string;
  visitType: string;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  prescribedMed: string | null;
  doctorName: string | null;
  nextVisitDate: string | null;
  notes: string | null;
  student?: Student;
}

interface Vaccination {
  id: string;
  studentId: string;
  vaccineName: string;
  vaccineType: string | null;
  dateGiven: string;
  nextDueDate: string | null;
  status: string;
  administeredBy: string | null;
  student?: Student;
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'vaccinations'>('records');
  const [students, setStudents] = useState<Student[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  
  const [recordForm, setRecordForm] = useState({
    studentId: '',
    visitType: 'CHECKUP',
    visitDate: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescribedMed: '',
    doctorName: '',
    nextVisitDate: '',
    notes: '',
  });
  
  const [vaccinationForm, setVaccinationForm] = useState({
    studentId: '',
    vaccineName: '',
    vaccineType: '',
    dateGiven: '',
    nextDueDate: '',
    administeredBy: '',
    status: 'COMPLETED',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsRes, recordsRes, vaccinationsRes] = await Promise.all([
        fetch('/api/sms/students'),
        fetch('/api/sms/medical-records'),
        fetch('/api/sms/vaccinations'),
      ]);
      
      const studentsData = await studentsRes.json();
      const recordsData = await recordsRes.json();
      const vaccinationsData = await vaccinationsRes.json();
      
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.students || []);
      setMedicalRecords(Array.isArray(recordsData) ? recordsData : recordsData.records || []);
      setVaccinations(Array.isArray(vaccinationsData) ? vaccinationsData : vaccinationsData.vaccinations || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/sms/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMedicalRecords([data.record, ...medicalRecords]);
        setShowRecordForm(false);
        setRecordForm({
          studentId: '',
          visitType: 'CHECKUP',
          visitDate: '',
          diagnosis: '',
          symptoms: '',
          treatment: '',
          prescribedMed: '',
          doctorName: '',
          nextVisitDate: '',
          notes: '',
        });
      }
    } catch (err) {
      console.error('Failed to add record:', err);
    }
  }

  async function handleAddVaccination(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/sms/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccinationForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVaccinations([data.vaccination, ...vaccinations]);
        setShowVaccinationForm(false);
        setVaccinationForm({
          studentId: '',
          vaccineName: '',
          vaccineType: '',
          dateGiven: '',
          nextDueDate: '',
          administeredBy: '',
          status: 'COMPLETED',
          notes: '',
        });
      }
    } catch (err) {
      console.error('Failed to add vaccination:', err);
    }
  }

  const getVisitTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CHECKUP: 'bg-blue-100 text-blue-800',
      ILLNESS: 'bg-orange-100 text-orange-800',
      EMERGENCY: 'bg-red-100 text-red-800',
      VACCINATION: 'bg-green-100 text-green-800',
      INJURY: 'bg-yellow-100 text-yellow-800',
      FOLLOWUP: 'bg-purple-100 text-purple-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || 'bg-gray-100'}`}>{type}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      DUE: 'bg-yellow-100 text-yellow-800',
      SKIPPED: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const filteredRecords = medicalRecords.filter(r => 
    r.student && `${r.student.firstName} ${r.student.lastName} ${r.student.studentId}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVaccinations = vaccinations.filter(v => 
    v.student && `${v.student.firstName} ${v.student.lastName} ${v.student.studentId}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-500 mt-1">Track student health history and vaccinations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold">{medicalRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Vaccinations</p>
                <p className="text-2xl font-bold">{vaccinations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">
                  {medicalRecords.filter(r => new Date(r.visitDate) > new Date(Date.now() - 30*24*60*60*1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold">
                  {vaccinations.filter(v => v.status === 'DUE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'records' | 'vaccinations')}>
        <TabsList>
          <TabsTrigger value="records">Medical Visits ({medicalRecords.length})</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations ({vaccinations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical Visit History</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 w-[250px]"
                  />
                </div>
                <Dialog open={showRecordForm} onOpenChange={setShowRecordForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Visit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Medical Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddRecord} className="space-y-4">
                      <div>
                        <Label>Student</Label>
                        <Select value={recordForm.studentId} onValueChange={val => setRecordForm({...recordForm, studentId: val})}>
                          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                          <SelectContent>
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Visit Type</Label>
                          <Select value={recordForm.visitType} onValueChange={val => setRecordForm({...recordForm, visitType: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CHECKUP">Checkup</SelectItem>
                              <SelectItem value="ILLNESS">Illness</SelectItem>
                              <SelectItem value="EMERGENCY">Emergency</SelectItem>
                              <SelectItem value="INJURY">Injury</SelectItem>
                              <SelectItem value="VACCINATION">Vaccination</SelectItem>
                              <SelectItem value="FOLLOWUP">Follow-up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Visit Date</Label>
                          <Input type="date" value={recordForm.visitDate} onChange={e => setRecordForm({...recordForm, visitDate: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <Label>Symptoms</Label>
                        <Textarea value={recordForm.symptoms} onChange={e => setRecordForm({...recordForm, symptoms: e.target.value})} placeholder="Describe symptoms..." />
                      </div>
                      <div>
                        <Label>Diagnosis</Label>
                        <Input value={recordForm.diagnosis} onChange={e => setRecordForm({...recordForm, diagnosis: e.target.value})} placeholder="Diagnosis" />
                      </div>
                      <div>
                        <Label>Treatment</Label>
                        <Textarea value={recordForm.treatment} onChange={e => setRecordForm({...recordForm, treatment: e.target.value})} placeholder="Treatment given..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Doctor Name</Label>
                          <Input value={recordForm.doctorName} onChange={e => setRecordForm({...recordForm, doctorName: e.target.value})} placeholder="Doctor's name" />
                        </div>
                        <div>
                          <Label>Next Visit</Label>
                          <Input type="date" value={recordForm.nextVisitDate} onChange={e => setRecordForm({...recordForm, nextVisitDate: e.target.value})} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Save Record</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No medical records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Diagnosis</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Doctor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{record.student?.firstName} {record.student?.lastName}</span>
                            </div>
                            <p className="text-xs text-gray-500">{record.student?.studentId}</p>
                          </td>
                          <td className="px-4 py-3">{getVisitTypeBadge(record.visitType)}</td>
                          <td className="px-4 py-3 text-sm">{new Date(record.visitDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">{record.diagnosis || '-'}</td>
                          <td className="px-4 py-3 text-sm">{record.doctorName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vaccination Records</CardTitle>
                <Dialog open={showVaccinationForm} onOpenChange={setShowVaccinationForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Vaccination
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Vaccination Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddVaccination} className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <Select value={vaccinationForm.studentId} onValueChange={val => setVaccinationForm({...vaccinationForm, studentId: val})}>
                        <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                        <SelectContent>
                          {students.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Vaccine Name</Label>
                      <Input value={vaccinationForm.vaccineName} onChange={e => setVaccinationForm({...vaccinationForm, vaccineName: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Vaccine Type</Label>
                        <Select value={vaccinationForm.vaccineType} onValueChange={val => setVaccinationForm({...vaccinationForm, vaccineType: val})}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POLIO">Polio</SelectItem>
                            <SelectItem value="MEASLES">Measles</SelectItem>
                            <SelectItem value="HEPATITIS_B">Hepatitis B</SelectItem>
                            <SelectItem value="BCG">BCG</SelectItem>
                            <SelectItem value="YELLOW_FEVER">Yellow Fever</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date Given</Label>
                        <Input type="date" value={vaccinationForm.dateGiven} onChange={e => setVaccinationForm({...vaccinationForm, dateGiven: e.target.value})} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <Select value={vaccinationForm.status} onValueChange={val => setVaccinationForm({...vaccinationForm, status: val})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="DUE">Due</SelectItem>
                            <SelectItem value="SKIPPED">Skipped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Next Due Date</Label>
                        <Input type="date" value={vaccinationForm.nextDueDate} onChange={e => setVaccinationForm({...vaccinationForm, nextDueDate: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <Label>Administered By</Label>
                      <Input value={vaccinationForm.administeredBy} onChange={e => setVaccinationForm({...vaccinationForm, administeredBy: e.target.value})} placeholder="Nurse/Doctor name" />
                    </div>
                    <Button type="submit" className="w-full">Save Vaccination</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredVaccinations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Syringe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No vaccination records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Vaccine</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date Given</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVaccinations.map(vax => (
                        <tr key={vax.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{vax.student?.firstName} {vax.student?.lastName}</span>
                            </div>
                            <p className="text-xs text-gray-500">{vax.student?.studentId}</p>
                          </td>
                          <td className="px-4 py-3 font-medium">{vax.vaccineName}</td>
                          <td className="px-4 py-3 text-sm">{vax.vaccineType || '-'}</td>
                          <td className="px-4 py-3 text-sm">{new Date(vax.dateGiven).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{getStatusBadge(vax.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}