'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-authFetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, FileText, Download, Send, Search, Filter, Eye } from 'lucide-react';

interface Transcript {
  id: string;
  documentNo: string | null;
  status: string;
  generatedAt: string;
  purpose: string | null;
  sendingTo: string | null;
  pdfUrl: string | null;
  student: { id: string; firstName: string; lastName: string; studentId: string };
  academicYear: { id: string; name: string };
}

export default function TranscriptsPage() {
  const [loading, setLoading] = useState(true);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  
  const [formData, setFormData] = useState({
    studentId: '',
    academicYearId: '',
    purpose: 'TRANSFER',
    sendingTo: '',
    notes: '',
  });

  useEffect(() => {
    authFetchData();
  }, []);

  async function authFetchData() {
    try {
      const [transcriptsRes, studentsRes, yearsRes] = await Promise.all([
        authFetch('/api/sms/transcripts'),
        authFetch('/api/sms/students'),
        authFetch('/api/sms/terms'),
      ]);
      
      const transcriptsData = await transcriptsRes.json();
      const studentsData = await studentsRes.json();
      const yearsData = await yearsRes.json();
      
      setTranscripts(transcriptsData.transcripts || []);
      setStudents(studentsData.students || []);
      
      const uniqueYears = yearsData.terms?.map((t: any) => t.academicYear).filter((y: any, i: number, arr: any[]) => 
        arr.findIndex((x: any) => x?.id === y?.id) === i
      ) || [];
      setAcademicYears(uniqueYears);
    } catch (err) {
      console.error('Failed to authFetch transcripts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTranscript(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/sms/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTranscripts([data.transcript, ...transcripts]);
        setShowGenerateModal(false);
        setFormData({ studentId: '', academicYearId: '', purpose: 'TRANSFER', sendingTo: '', notes: '' });
      }
    } catch (err) {
      console.error('Failed to generate transcript:', err);
    }
  }

  async function handleSendTranscript(id: string) {
    try {
      const res = await authFetch(`/api/sms/transcripts/${id}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        authFetchData();
      }
    } catch (err) {
      console.error('Failed to send transcript:', err);
    }
  }

  async function handleGeneratePDF(id: string) {
    try {
      const res = await authFetch(`/api/sms/transcripts/${id}/generate-pdf`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        authFetchData();
        
        if (data.pdfBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
          link.download = `transcript-${data.transcript.documentNo}.pdf`;
          link.click();
        }
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  }

  const filteredTranscripts = transcripts.filter(t => {
    const matchesSearch = `${t.student.firstName} ${t.student.lastName} ${t.student.studentId} ${t.documentNo}`
      .toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      GENERATED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
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
          <h1 className="text-2xl font-bold text-gray-900">Transcript Center</h1>
          <p className="text-gray-500 mt-1">Generate and manage student transcripts</p>
        </div>
        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Generate Transcript
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Transcript</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGenerateTranscript} className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select value={formData.studentId} onValueChange={val => setFormData({...formData, studentId: val})}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select value={formData.academicYearId} onValueChange={val => setFormData({...formData, academicYearId: val})}>
                  <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(ay => (
                      <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purpose</Label>
                <Select value={formData.purpose} onValueChange={val => setFormData({...formData, purpose: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFER">School Transfer</SelectItem>
                    <SelectItem value="UNIVERSITY">University Application</SelectItem>
                    <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sending To (Institution)</Label>
                <Input 
                  value={formData.sendingTo} 
                  onChange={e => setFormData({...formData, sendingTo: e.target.value})} 
                  placeholder="e.g., University of Lagos" 
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Optional notes" 
                />
              </div>
              <Button type="submit" className="w-full">Generate Transcript</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Transcripts</p>
            <p className="text-2xl font-bold">{transcripts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Generated</p>
            <p className="text-2xl font-bold text-blue-600">
              {transcripts.filter(t => t.status === 'GENERATED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Sent</p>
            <p className="text-2xl font-bold text-purple-600">
              {transcripts.filter(t => t.status === 'SENT').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {transcripts.filter(t => t.status === 'DELIVERED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transcripts</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search transcripts..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTranscripts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No transcripts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Document No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Academic Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sending To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTranscripts.map(transcript => (
                    <tr key={transcript.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{transcript.documentNo || '-'}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{transcript.student.firstName} {transcript.student.lastName}</p>
                          <p className="text-sm text-gray-500">{transcript.student.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{transcript.academicYear.name}</td>
                      <td className="px-4 py-3">{transcript.purpose || '-'}</td>
                      <td className="px-4 py-3">{transcript.sendingTo || '-'}</td>
                      <td className="px-4 py-3">{getStatusBadge(transcript.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(transcript.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTranscript(transcript)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transcript.status === 'DRAFT' && (
                            <Button variant="ghost" size="sm" onClick={() => handleGeneratePDF(transcript.id)} title="Generate PDF">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {transcript.pdfUrl && (
                            <Button variant="ghost" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleSendTranscript(transcript.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTranscript && (
        <Dialog open={!!selectedTranscript} onOpenChange={() => setSelectedTranscript(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transcript Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Document Number</p>
                  <p className="font-medium">{selectedTranscript.documentNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedTranscript.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium">{selectedTranscript.student.firstName} {selectedTranscript.student.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedTranscript.student.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{selectedTranscript.academicYear.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-medium">{selectedTranscript.purpose || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sending To</p>
                  <p className="font-medium">{selectedTranscript.sendingTo || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Generated On</p>
                <p className="font-medium">{new Date(selectedTranscript.generatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 pt-4">
                {selectedTranscript.pdfUrl && (
                  <Button>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleSendTranscript(selectedTranscript.id)}>
                  <Send className="h-4 w-4 mr-2" /> Send Transcript
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}