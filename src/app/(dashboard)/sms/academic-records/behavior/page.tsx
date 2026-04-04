'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, AlertTriangle, TrendingUp, FileText, Search, User, Shield } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface BehaviorIncident {
  id: string;
  studentId: string;
  date: string;
  incidentType: string;
  severity: string;
  location: string | null;
  description: string;
  actionTaken: string | null;
  actionType: string | null;
  status: string;
  parentNotified: boolean;
  student?: Student;
}

interface BehaviorLog {
  id: string;
  studentId: string;
  date: string;
  behaviorType: string;
  category: string;
  points: number;
  description: string | null;
  remarks: string | null;
  student?: Student;
}

export default function BehavioralRecordsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incidents' | 'logs'>('incidents');
  const [students, setStudents] = useState<Student[]>([]);
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  
  const [incidentForm, setIncidentForm] = useState({
    studentId: '',
    date: '',
    incidentType: '',
    severity: 'LOW',
    location: '',
    description: '',
    actionType: '',
    actionTaken: '',
    parentNotified: false,
    status: 'OPEN',
  });
  
  const [logForm, setLogForm] = useState({
    studentId: '',
    date: '',
    behaviorType: 'POSITIVE',
    category: 'ATTITUDE',
    points: 0,
    description: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsRes, incidentsRes, logsRes] = await Promise.all([
        fetch('/api/sms/students'),
        fetch('/api/sms/behavior-incidents'),
        fetch('/api/sms/behavior-logs'),
      ]);
      
      const studentsData = await studentsRes.json();
      const incidentsData = await incidentsRes.json();
      const logsData = await logsRes.json();
      
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.students || []);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : incidentsData.incidents || []);
      setLogs(Array.isArray(logsData) ? logsData : logsData.logs || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIncident(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/sms/behavior-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setIncidents([data.incident, ...incidents]);
        setShowIncidentForm(false);
        setIncidentForm({
          studentId: '',
          date: '',
          incidentType: '',
          severity: 'LOW',
          location: '',
          description: '',
          actionType: '',
          actionTaken: '',
          parentNotified: false,
          status: 'OPEN',
        });
      }
    } catch (err) {
      console.error('Failed to add incident:', err);
    }
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/sms/behavior-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs([data.log, ...logs]);
        setShowLogForm(false);
        setLogForm({
          studentId: '',
          date: '',
          behaviorType: 'POSITIVE',
          category: 'ATTITUDE',
          points: 0,
          description: '',
          remarks: '',
        });
      }
    } catch (err) {
      console.error('Failed to add log:', err);
    }
  }

  const positivePoints = logs.filter(l => l.behaviorType === 'POSITIVE').reduce((sum, l) => sum + l.points, 0);
  const negativePoints = logs.filter(l => l.behaviorType === 'NEGATIVE').reduce((sum, l) => sum + Math.abs(l.points), 0);

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[severity] || 'bg-gray-100'}`}>{severity}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      INVESTIGATING: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const filteredIncidents = incidents.filter(i => 
    i.student && `${i.student.firstName} ${i.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.student && `${l.student.firstName} ${l.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Behavioral Records</h1>
          <p className="text-gray-500 mt-1">Monitor student behavior and discipline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Total Incidents</p>
                <p className="text-2xl font-bold">{incidents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Open Cases</p>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'OPEN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Positive Points</p>
                <p className="text-2xl font-bold text-green-600">+{positivePoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-500 rotate-180" />
              <div>
                <p className="text-sm text-gray-500">Negative Points</p>
                <p className="text-2xl font-bold text-red-600">-{negativePoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'incidents' | 'logs')}>
        <TabsList>
          <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="logs">Behavior Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Behavior Incidents</CardTitle>
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
                <Dialog open={showIncidentForm} onOpenChange={setShowIncidentForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Report Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Report Behavior Incident</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddIncident} className="space-y-4">
                      <div>
                        <Label>Student</Label>
                        <Select value={incidentForm.studentId} onValueChange={val => setIncidentForm({...incidentForm, studentId: val})}>
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
                          <Label>Date</Label>
                          <Input type="date" value={incidentForm.date} onChange={e => setIncidentForm({...incidentForm, date: e.target.value})} required />
                        </div>
                        <div>
                          <Label>Incident Type</Label>
                          <Select value={incidentForm.incidentType} onValueChange={val => setIncidentForm({...incidentForm, incidentType: val})}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BULLYING">Bullying</SelectItem>
                              <SelectItem value="FIGHTING">Fighting</SelectItem>
                              <SelectItem value="LATE_COMING">Late Coming</SelectItem>
                              <SelectItem value="ABSENTEEISM">Absenteeism</SelectItem>
                              <SelectItem value="INSULTING">Insulting</SelectItem>
                              <SelectItem value="THEFT">Theft</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Severity</Label>
                          <Select value={incidentForm.severity} onValueChange={val => setIncidentForm({...incidentForm, severity: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={incidentForm.status} onValueChange={val => setIncidentForm({...incidentForm, status: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={incidentForm.description} onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} required placeholder="Describe what happened..." />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="parentNotified" checked={incidentForm.parentNotified} onChange={e => setIncidentForm({...incidentForm, parentNotified: e.target.checked})} />
                        <Label htmlFor="parentNotified">Parent Notified</Label>
                      </div>
                      <Button type="submit" className="w-full">Submit Incident</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No incidents recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Parent Notified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredIncidents.map(incident => (
                        <tr key={incident.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{incident.student?.firstName} {incident.student?.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{incident.incidentType.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3">{getSeverityBadge(incident.severity)}</td>
                          <td className="px-4 py-3">{getStatusBadge(incident.status)}</td>
                          <td className="px-4 py-3 text-sm">{new Date(incident.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{incident.parentNotified ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Behavior Logs</CardTitle>
              <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Behavior Log</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddLog} className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <Select value={logForm.studentId} onValueChange={val => setLogForm({...logForm, studentId: val})}>
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
                        <Label>Date</Label>
                        <Input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} required />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={logForm.behaviorType} onValueChange={val => setLogForm({...logForm, behaviorType: val})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POSITIVE">Positive</SelectItem>
                            <SelectItem value="NEGATIVE">Negative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={logForm.category} onValueChange={val => setLogForm({...logForm, category: val})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATTITUDE">Attitude</SelectItem>
                            <SelectItem value="DISCIPLINE">Discipline</SelectItem>
                            <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                            <SelectItem value="SOCIAL">Social</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input type="number" value={logForm.points} onChange={e => setLogForm({...logForm, points: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={logForm.description} onChange={e => setLogForm({...logForm, description: e.target.value})} placeholder="Brief description..." />
                    </div>
                    <Button type="submit" className="w-full">Save Log</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No behavior logs recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{log.student?.firstName} {log.student?.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${log.behaviorType === 'POSITIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {log.behaviorType}
                            </span>
                          </td>
                          <td className="px-4 py-3">{log.category}</td>
                          <td className={`px-4 py-3 font-medium ${log.behaviorType === 'POSITIVE' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.behaviorType === 'POSITIVE' ? '+' : '-'}{Math.abs(log.points)}
                          </td>
                          <td className="px-4 py-3 text-sm">{new Date(log.date).toLocaleDateString()}</td>
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