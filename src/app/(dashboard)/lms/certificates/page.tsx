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
import { Loader2, Plus, Award, FileText, Send, Download, Search } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  autoIssue: boolean;
  createdAt: string;
}

interface CertificateIssuance {
  id: string;
  certificateNo: string;
  status: string;
  issuedAt: string;
  student: { firstName: string; lastName: string; studentId: string };
  template: { name: string };
  pdfUrl: string | null;
  recipientEmail: string | null;
}

export default function CertificateCenterPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'issuances'>('templates');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [issuances, setIssuances] = useState<CertificateIssuance[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showIssuanceForm, setShowIssuanceForm] = useState(false);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'COMPLETION',
    isActive: true,
    autoIssue: false,
  });
  
  const [issuanceForm, setIssuanceForm] = useState({
    studentId: '',
    templateId: '',
    recipientEmail: '',
    recipientName: '',
    notes: '',
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [templatesRes, issuancesRes, studentsRes] = await Promise.all([
        authFetch('/api/lms/certificates/templates'),
        authFetch('/api/lms/certificates/issuances'),
        authFetch('/api/sms/students'),
      ]);
      
      const templatesData = await templatesRes.json();
      const issuancesData = await issuancesRes.json();
      const studentsData = await studentsRes.json();
      
      setTemplates(templatesData.templates || []);
      setIssuances(issuancesData.issuances || []);
      setStudents(studentsData.students || []);
    } catch (err) {
      console.error('Failed to fetch certificate data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/lms/certificates/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTemplates([data.template, ...templates]);
        setShowTemplateForm(false);
        setTemplateForm({ name: '', description: '', category: 'COMPLETION', isActive: true, autoIssue: false });
      }
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  }

  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/lms/certificates/issuances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issuanceForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setIssuances([data.issuance, ...issuances]);
        setShowIssuanceForm(false);
        setIssuanceForm({ studentId: '', templateId: '', recipientEmail: '', recipientName: '', notes: '' });
      }
    } catch (err) {
      console.error('Failed to issue certificate:', err);
    }
  }

  async function handleGeneratePDF(id: string) {
    try {
      const res = await authFetch(`/api/lms/certificates/issuances/${id}/generate-pdf`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        fetchData();
        
        if (data.pdfBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
          link.download = `certificate-${data.issuance.certificateNo}.pdf`;
          link.click();
        }
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  }

  async function handleSendCertificate(id: string) {
    try {
      const res = await authFetch(`/api/lms/certificates/issuances/${id}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to send certificate:', err);
    }
  }

  const filteredIssuances = issuances.filter(i =>
    `${i.student.firstName} ${i.student.lastName} ${i.certificateNo}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      GENERATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ISSUED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      SENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      VIEWED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}>{status}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      COMPLETION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ACHIEVEMENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ATTENDANCE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      SPORTS: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      LEADERSHIP: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[category] || 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}>{category}</span>;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificate Center</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">Manage certificate templates and issue certificates to students</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'templates' | 'issuances')}>
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="templates" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="issuances" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Issued Certificates ({issuances.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Certificate Templates</CardTitle>
              <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">Create Certificate Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div>
                      <Label className="dark:text-gray-300">Template Name</Label>
                      <Input className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} required placeholder="e.g., Completion Certificate" />
                    </div>
                    <div>
                      <Label className="dark:text-gray-300">Description</Label>
                      <Textarea className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={templateForm.description} onChange={e => setTemplateForm({...templateForm, description: e.target.value})} placeholder="Template description..." />
                    </div>
                    <div>
                      <Label className="dark:text-gray-300">Category</Label>
                      <Select value={templateForm.category} onValueChange={val => setTemplateForm({...templateForm, category: val})}>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                          <SelectItem value="COMPLETION">Completion</SelectItem>
                          <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                          <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                          <SelectItem value="SPORTS">Sports</SelectItem>
                          <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="dark:bg-gray-700 dark:border-gray-600" checked={templateForm.isActive} onChange={e => setTemplateForm({...templateForm, isActive: e.target.checked})} />
                        <span className="text-sm dark:text-gray-300">Active</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="dark:bg-gray-700 dark:border-gray-600" checked={templateForm.autoIssue} onChange={e => setTemplateForm({...templateForm, autoIssue: e.target.checked})} />
                        <span className="text-sm dark:text-gray-300">Auto-issue when criteria met</span>
                      </label>
                    </div>
                    <Button type="submit" className="w-full">Create Template</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No certificate templates created</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4 dark:border-gray-600 dark:bg-gray-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium dark:text-white">{template.name}</h3>
                        {getCategoryBadge(template.category)}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className={template.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {template.autoIssue && (
                          <span className="text-blue-600 dark:text-blue-400">Auto-issue</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issuances">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Issued Certificates</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search certificates..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 w-[250px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Dialog open={showIssuanceForm} onOpenChange={setShowIssuanceForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Issue Certificate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Issue Certificate</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleIssueCertificate} className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-300">Student</Label>
                        <Select value={issuanceForm.studentId} onValueChange={val => setIssuanceForm({...issuanceForm, studentId: val})}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Select student" /></SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Certificate Template</Label>
                        <Select value={issuanceForm.templateId} onValueChange={val => setIssuanceForm({...issuanceForm, templateId: val})}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Select template" /></SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                            {templates.filter(t => t.isActive).map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="dark:text-gray-300">Recipient Name (optional)</Label>
                          <Input className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={issuanceForm.recipientName} onChange={e => setIssuanceForm({...issuanceForm, recipientName: e.target.value})} placeholder="Full name" />
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">Email (optional)</Label>
                          <Input type="email" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={issuanceForm.recipientEmail} onChange={e => setIssuanceForm({...issuanceForm, recipientEmail: e.target.value})} placeholder="email@example.com" />
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Notes</Label>
                        <Textarea className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={issuanceForm.notes} onChange={e => setIssuanceForm({...issuanceForm, notes: e.target.value})} placeholder="Optional notes..." />
                      </div>
                      <Button type="submit" className="w-full">Issue Certificate</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredIssuances.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Award className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No certificates issued yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIssuances.map(issuance => (
                    <div key={issuance.id} className="border rounded-lg p-4 flex items-center justify-between dark:border-gray-600 dark:bg-gray-700/50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium dark:text-white">{issuance.student.firstName} {issuance.student.lastName}</span>
                            {getStatusBadge(issuance.status)}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {issuance.template.name} • {issuance.certificateNo}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Issued: {new Date(issuance.issuedAt).toLocaleDateString()}
                            {issuance.recipientEmail && ` • Sent to: ${issuance.recipientEmail}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {issuance.status === 'GENERATED' && (
                          <Button variant="ghost" size="sm" onClick={() => handleGeneratePDF(issuance.id)} title="Download PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {issuance.status !== 'GENERATED' && issuance.status !== 'SENT' && (
                          <Button variant="ghost" size="sm" onClick={() => handleGeneratePDF(issuance.id)} title="Generate PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleSendCertificate(issuance.id)} title="Send">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
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