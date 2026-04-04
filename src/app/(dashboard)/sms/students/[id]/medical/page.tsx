'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { Loader2, Plus, Syringe, FileText, Calendar, AlertTriangle } from 'lucide-react';

interface MedicalRecord {
  id: string;
  visitDate: string;
  visitType: string;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  prescribedMed: string | null;
  doctorName: string | null;
  nextVisitDate: string | null;
  notes: string | null;
}

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType: string | null;
  dateGiven: string;
  nextDueDate: string | null;
  status: string;
  administeredBy: string | null;
}

interface ChronicCondition {
  id: string;
  condition: string;
  diagnosedDate: string | null;
  status: string;
  severity: string | null;
  treatment: string | null;
  medication: string | null;
  nextCheckup: string | null;
}

export default function StudentMedicalPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'vaccinations' | 'conditions'>('records');
  
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [conditions, setConditions] = useState<ChronicCondition[]>([]);
  
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showConditionForm, setShowConditionForm] = useState(false);
  
  const [recordForm, setRecordForm] = useState({
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
    vaccineName: '',
    vaccineType: '',
    dateGiven: '',
    nextDueDate: '',
    administeredBy: '',
    status: 'COMPLETED',
    notes: '',
  });
  
  const [conditionForm, setConditionForm] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'ACTIVE',
    severity: '',
    treatment: '',
    medication: '',
    nextCheckup: '',
    notes: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  async function fetchData() {
    try {
      const [recordsRes, vaccinationsRes] = await Promise.all([
        fetch(`/api/sms/students/${params.id}/medical`),
        fetch(`/api/sms/students/${params.id}/vaccinations`),
      ]);
      
      const recordsData = await recordsRes.json();
      const vaccinationsData = await vaccinationsRes.json();
      
      setMedicalRecords(recordsData.records || []);
      setVaccinations(vaccinationsData.vaccinations || []);
    } catch (err) {
      console.error('Failed to fetch medical data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sms/students/${params.id}/medical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMedicalRecords([data.record, ...medicalRecords]);
        setShowRecordForm(false);
        setRecordForm({
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
      console.error('Failed to add medical record:', err);
    }
  }

  async function handleAddVaccination(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sms/students/${params.id}/vaccinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccinationForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVaccinations([data.vaccination, ...vaccinations]);
        setShowVaccinationForm(false);
        setVaccinationForm({
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
          <p className="text-gray-500 mt-1">Student health history and vaccinations</p>
        </div>
        <Link href={`/sms/students/${params.id}`}>
          <Button variant="outline">Back to Student</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'records' | 'vaccinations' | 'conditions')}>
        <TabsList>
          <TabsTrigger value="records">Medical Visits ({medicalRecords.length})</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations ({vaccinations.length})</TabsTrigger>
          <TabsTrigger value="conditions">Chronic Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical Visit History</CardTitle>
              <Dialog open={showRecordForm} onOpenChange={setShowRecordForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Visit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Medical Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRecord} className="space-y-4">
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
                    <div>
                      <Label>Prescribed Medication</Label>
                      <Input value={recordForm.prescribedMed} onChange={e => setRecordForm({...recordForm, prescribedMed: e.target.value})} placeholder="Medications" />
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
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={recordForm.notes} onChange={e => setRecordForm({...recordForm, notes: e.target.value})} placeholder="Additional notes..." />
                    </div>
                    <Button type="submit" className="w-full">Save Record</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {medicalRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No medical records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map(record => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {getVisitTypeBadge(record.visitType)}
                            <span className="text-sm text-gray-500">
                              {new Date(record.visitDate).toLocaleDateString()}
                            </span>
                          </div>
                          {record.diagnosis && (
                            <p className="font-medium">Diagnosis: {record.diagnosis}</p>
                          )}
                          {record.symptoms && (
                            <p className="text-sm text-gray-600 mt-1">Symptoms: {record.symptoms}</p>
                          )}
                          {record.treatment && (
                            <p className="text-sm text-gray-600 mt-1">Treatment: {record.treatment}</p>
                          )}
                          {record.prescribedMed && (
                            <p className="text-sm text-gray-600 mt-1">Prescribed: {record.prescribedMed}</p>
                          )}
                          {record.nextVisitDate && (
                            <p className="text-sm text-blue-600 mt-2">
                              Next visit: {new Date(record.nextVisitDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Vaccination Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVaccination} className="space-y-4">
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
              {vaccinations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Syringe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No vaccination records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vaccinations.map(vax => (
                    <div key={vax.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{vax.vaccineName}</span>
                          {getStatusBadge(vax.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {vax.vaccineType && `${vax.vaccineType} • `}
                          Given: {new Date(vax.dateGiven).toLocaleDateString()}
                          {vax.administeredBy && ` by ${vax.administeredBy}`}
                        </p>
                        {vax.nextDueDate && (
                          <p className="text-sm text-blue-600 mt-1">
                            Next due: {new Date(vax.nextDueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions">
          <Card>
            <CardHeader>
              <CardTitle>Chronic Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No chronic conditions recorded</p>
                <Button className="mt-4">Add Condition</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}