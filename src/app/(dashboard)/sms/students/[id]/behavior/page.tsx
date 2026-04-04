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
import { Loader2, Plus, AlertTriangle, TrendingUp, FileText } from 'lucide-react';

interface BehaviorIncident {
  id: string;
  date: string;
  incidentType: string;
  severity: string;
  location: string | null;
  description: string;
  actionTaken: string | null;
  actionType: string | null;
  status: string;
  parentNotified: boolean;
}

interface BehaviorLog {
  id: string;
  date: string;
  behaviorType: string;
  category: string;
  points: number;
  description: string | null;
  remarks: string | null;
}

export default function StudentBehaviorPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incidents' | 'logs'>('incidents');
  
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  
  const [incidentForm, setIncidentForm] = useState({
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
    date: '',
    behaviorType: 'POSITIVE',
    category: 'ATTITUDE',
    points: 0,
    description: '',
    remarks: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  async function fetchData() {
    try {
      const [incidentsRes, logsRes] = await Promise.all([
        fetch(`/api/sms/students/${params.id}/incidents`),
        fetch(`/api/sms/students/${params.id}/behavior-log`),
      ]);
      
      const incidentsData = await incidentsRes.json();
      const logsData = await logsRes.json();
      
      setIncidents(incidentsData.incidents || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to fetch behavior data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIncident(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sms/students/${params.id}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setIncidents([data.incident, ...incidents]);
        setShowIncidentForm(false);
        setIncidentForm({
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
      const res = await fetch(`/api/sms/students/${params.id}/behavior-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs([data.log, ...logs]);
        setShowLogForm(false);
        setLogForm({
          date: '',
          behaviorType: 'POSITIVE',
          category: 'ATTITUDE',
          points: 0,
          description: '',
          remarks: '',
        });
      }
    } catch (err) {
      console.error('Failed to add behavior log:', err);
    }
  }

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
      ESCALATED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const getBehaviorTypeBadge = (type: string) => {
    return type === 'POSITIVE' 
      ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Positive</span>
      : <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Negative</span>;
  };

  const positivePoints = logs.filter(l => l.behaviorType === 'POSITIVE').reduce((sum, l) => sum + l.points, 0);
  const negativePoints = logs.filter(l => l.behaviorType === 'NEGATIVE').reduce((sum, l) => sum + Math.abs(l.points), 0);
  const totalPoints = positivePoints - negativePoints;

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
          <p className="text-gray-500 mt-1">Student behavior incidents and logs</p>
        </div>
        <Link href={`/sms/students/${params.id}`}>
          <Button variant="outline">Back to Student</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Positive Points</p>
                <p className="text-2xl font-bold text-green-600">+{positivePoints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Negative Points</p>
                <p className="text-2xl font-bold text-red-600">-{negativePoints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className={`text-2xl font-bold ${totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPoints >= 0 ? '+' : ''}{totalPoints}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}`} />
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
              <Dialog open={showIncidentForm} onOpenChange={setShowIncidentForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Report Incident
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Report Behavior Incident</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddIncident} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={incidentForm.date} onChange={e => setIncidentForm({...incidentForm, date: e.target.value})} required />
                      </div>
                      <div>
                        <Label>Incident Type</Label>
                        <Select value={incidentForm.incidentType} onValueChange={val => setIncidentForm({...incidentForm, incidentType: val})} required>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BULLYING">Bullying</SelectItem>
                            <SelectItem value="FIGHTING">Fighting</SelectItem>
                            <SelectItem value="LATE_COMING">Late Coming</SelectItem>
                            <SelectItem value="ABSENTEEISM">Absenteeism</SelectItem>
                            <SelectItem value="INSULTING">Insulting</SelectItem>
                            <SelectItem value="THEFT">Theft</SelectItem>
                            <SelectItem value="VANDALISM">Vandalism</SelectItem>
                            <SelectItem value="DRUG_USE">Drug Use</SelectItem>
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
                        <Label>Location</Label>
                        <Input value={incidentForm.location} onChange={e => setIncidentForm({...incidentForm, location: e.target.value})} placeholder="e.g., Classroom" />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={incidentForm.description} onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} required placeholder="Describe what happened..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Action Type</Label>
                        <Select value={incidentForm.actionType} onValueChange={val => setIncidentForm({...incidentForm, actionType: val})}>
                          <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WARNING">Warning</SelectItem>
                            <SelectItem value="SUSPENSION">Suspension</SelectItem>
                            <SelectItem value="COUNSELING">Counseling</SelectItem>
                            <SelectItem value="PARENT_NOTIFIED">Parent Notified</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
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
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="parentNotified" checked={incidentForm.parentNotified} onChange={e => setIncidentForm({...incidentForm, parentNotified: e.target.checked})} />
                      <Label htmlFor="parentNotified">Parent Notified</Label>
                    </div>
                    <Button type="submit" className="w-full">Submit Incident</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No behavior incidents recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map(incident => (
                    <div key={incident.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{incident.incidentType.replace(/_/g, ' ')}</span>
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                          <p className="text-sm text-gray-600">{incident.description}</p>
                          {incident.location && (
                            <p className="text-sm text-gray-500 mt-1">Location: {incident.location}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(incident.date).toLocaleDateString()}
                            {incident.parentNotified && <span className="ml-2 text-blue-600">• Parent notified</span>}
                          </p>
                          {incident.actionTaken && (
                            <p className="text-sm text-green-600 mt-2">Action: {incident.actionTaken}</p>
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
                            <SelectItem value="ACADEMIC">Academic</SelectItem>
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
                    <div>
                      <Label>Remarks</Label>
                      <Textarea value={logForm.remarks} onChange={e => setLogForm({...logForm, remarks: e.target.value})} placeholder="Teacher remarks..." />
                    </div>
                    <Button type="submit" className="w-full">Save Log</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No behavior logs recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getBehaviorTypeBadge(log.behaviorType)}
                        <div>
                          <p className="font-medium">{log.category}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.date).toLocaleDateString()} • {log.description || 'No description'}
                          </p>
                          {log.remarks && <p className="text-sm text-gray-600 mt-1">Note: {log.remarks}</p>}
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${log.behaviorType === 'POSITIVE' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.behaviorType === 'POSITIVE' ? '+' : '-'}{Math.abs(log.points)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}