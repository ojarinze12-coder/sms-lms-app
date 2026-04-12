'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, FileText, Upload, Check, X, Eye, Download } from 'lucide-react';

interface DocumentCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  requiredFor: string[];
  isRequired: boolean;
  expiryMonths?: number;
  _count?: { documents: number };
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  categoryId: string;
  category?: { displayName: string };
  studentId?: string;
  student?: { firstName: string; lastName: string; studentId: string };
  teacherId?: string;
  teacher?: { firstName: string; lastName: string; employeeId: string };
  staffId?: string;
  staff?: { firstName: string; lastName: string; employeeId: string };
  expiryDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'categories'>('documents');
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    displayName: '',
    description: '',
    requiredFor: [] as string[],
    isRequired: false,
    expiryMonths: ''
  });
  
  const [documentForm, setDocumentForm] = useState({
    name: '',
    categoryId: '',
    fileUrl: '',
    fileName: '',
    mimeType: '',
    size: '',
    studentId: '',
    teacherId: '',
    staffId: '',
    expiryDate: '',
    notes: ''
  });
  
  const [ownerType, setOwnerType] = useState<'student' | 'teacher' | 'staff' | ''>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.studentId}`.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredTeachers = teachers.filter(t => 
    `${t.firstName} ${t.lastName} ${t.employeeId}`.toLowerCase().includes(teacherSearch.toLowerCase())
  );
  const filteredStaff = staff.filter(s => 
    `${s.firstName} ${s.lastName} ${s.employeeId}`.toLowerCase().includes(staffSearch.toLowerCase())
  );

  async function fetchData() {
    try {
      const [catRes, docRes, studentsRes, teachersRes, staffRes] = await Promise.all([
        authFetch('/api/sms/documents/categories'),
        authFetch('/api/sms/documents'),
        authFetch('/api/sms/students'),
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/staff')
      ]);
      
      const catData = await catRes.json();
      const docData = await docRes.json();
      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();
      const staffData = await staffRes.json();
      
      setCategories(Array.isArray(catData) ? catData : []);
      setDocuments(Array.isArray(docData) ? docData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error('Failed to fetch document data:', err);
      setCategories([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/sms/documents/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          requiredFor: categoryForm.requiredFor
        })
      });
      
      if (res.ok) {
        setShowCategoryForm(false);
        setCategoryForm({ name: '', displayName: '', description: '', requiredFor: [], isRequired: false, expiryMonths: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add category:', err);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`/api/sms/documents/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  }

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/sms/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...documentForm,
          size: parseInt(documentForm.size) || 0,
          studentId: documentForm.studentId || undefined,
          teacherId: documentForm.teacherId || undefined,
          staffId: documentForm.staffId || undefined,
          expiryDate: documentForm.expiryDate || undefined
        })
      });
      
      if (res.ok) {
        setShowDocumentForm(false);
        setDocumentForm({ name: '', categoryId: '', fileUrl: '', fileName: '', mimeType: '', size: '', studentId: '', teacherId: '', staffId: '', expiryDate: '', notes: '' });
        setOwnerType('');
        setStudentSearch('');
        setTeacherSearch('');
        setStaffSearch('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  }

  async function handleDeleteDocument(id: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await fetch(`/api/sms/documents/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/sms/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to update document status:', err);
    }
  }

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.categoryId === selectedCategory);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
      case 'EXPIRED': return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Expired</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage student, teacher and staff documents</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'documents' | 'categories')}>
        <TabsList className="mb-4">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">All Documents</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showDocumentForm} onOpenChange={(open) => {
                  setShowDocumentForm(open);
                  if (!open) {
                    setDocumentForm(prev => ({ ...prev, name: '', categoryId: '', fileUrl: '', fileName: '', mimeType: '', size: '', studentId: '', teacherId: '', staffId: '', expiryDate: '', notes: '' }));
                    setOwnerType('');
                    setStudentSearch('');
                    setTeacherSearch('');
                    setStaffSearch('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Upload Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDocument} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      <div>
                        <Label className="dark:text-gray-200">Document Name</Label>
                        <Input 
                          value={documentForm.name}
                          onChange={e => setDocumentForm({...documentForm, name: e.target.value})}
                          placeholder="e.g., Passport Photo"
                          required
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Category</Label>
                        <Select 
                          value={documentForm.categoryId}
                          onValueChange={val => setDocumentForm({...documentForm, categoryId: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.displayName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Related To</Label>
                        <Select 
                          value={ownerType}
                          onValueChange={val => {
                            setOwnerType(val as 'student' | 'teacher' | 'staff' | '');
                            setDocumentForm({...documentForm, studentId: '', teacherId: '', staffId: ''});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {ownerType === 'student' && (
                        <div>
                          <Label className="dark:text-gray-200">Student</Label>
                          <Input
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            className="mb-2"
                          />
                          <Select 
                            value={documentForm.studentId}
                            onValueChange={val => setDocumentForm({...documentForm, studentId: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStudents.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {ownerType === 'teacher' && (
                        <div>
                          <Label className="dark:text-gray-200">Teacher</Label>
                          <Input
                            placeholder="Search teachers..."
                            value={teacherSearch}
                            onChange={e => setTeacherSearch(e.target.value)}
                            className="mb-2"
                          />
                          <Select 
                            value={documentForm.teacherId}
                            onValueChange={val => setDocumentForm({...documentForm, teacherId: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredTeachers.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.employeeId})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {ownerType === 'staff' && (
                        <div>
                          <Label className="dark:text-gray-200">Staff</Label>
                          <Input
                            placeholder="Search staff..."
                            value={staffSearch}
                            onChange={e => setStaffSearch(e.target.value)}
                            className="mb-2"
                          />
                          <Select 
                            value={documentForm.staffId}
                            onValueChange={val => setDocumentForm({...documentForm, staffId: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStaff.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="dark:text-gray-200">File URL</Label>
                        <Input 
                          value={documentForm.fileUrl}
                          onChange={e => setDocumentForm({...documentForm, fileUrl: e.target.value})}
                          placeholder="https://..."
                          required
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">File Name</Label>
                        <Input 
                          value={documentForm.fileName}
                          onChange={e => setDocumentForm({...documentForm, fileName: e.target.value})}
                          placeholder="document.pdf"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="dark:text-gray-200">Mime Type</Label>
                          <Input 
                            value={documentForm.mimeType}
                            onChange={e => setDocumentForm({...documentForm, mimeType: e.target.value})}
                            placeholder="application/pdf"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Size (bytes)</Label>
                          <Input 
                            type="number"
                            value={documentForm.size}
                            onChange={e => setDocumentForm({...documentForm, size: e.target.value})}
                            placeholder="1024"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Expiry Date (optional)</Label>
                        <Input 
                          type="date"
                          value={documentForm.expiryDate}
                          onChange={e => setDocumentForm({...documentForm, expiryDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Notes</Label>
                        <Input 
                          value={documentForm.notes}
                          onChange={e => setDocumentForm({...documentForm, notes: e.target.value})}
                          placeholder="Optional notes"
                        />
                      </div>
                      <Button type="submit" className="w-full">Upload Document</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No documents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Category</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Owner</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Size</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredDocuments.map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">{doc.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{doc.fileName}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {doc.category?.displayName || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {doc.student ? `${doc.student.firstName} ${doc.student.lastName}` :
                             doc.teacher ? `${doc.teacher.firstName} ${doc.teacher.lastName}` :
                             doc.staff ? `${doc.staff.firstName} ${doc.staff.lastName}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {formatFileSize(doc.size)}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                              {doc.status === 'PENDING' && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(doc.id, 'VERIFIED')}>
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(doc.id, 'REJECTED')}>
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
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
        </TabsContent>

        <TabsContent value="categories">
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Document Categories</CardTitle>
              <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">Add Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                      <Label className="dark:text-gray-200">Name (code)</Label>
                      <Input 
                        value={categoryForm.name}
                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                        placeholder="e.g., PROFILE_PHOTO"
                        required
                      />
                    </div>
                    <div>
                      <Label className="dark:text-gray-200">Display Name</Label>
                      <Input 
                        value={categoryForm.displayName}
                        onChange={e => setCategoryForm({...categoryForm, displayName: e.target.value})}
                        placeholder="e.g., Profile Photo"
                        required
                      />
                    </div>
                    <div>
                      <Label className="dark:text-gray-200">Description</Label>
                      <Input 
                        value={categoryForm.description}
                        onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label className="dark:text-gray-200">Required For</Label>
                      <div className="flex gap-4 mt-2 dark:text-gray-300">
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={categoryForm.requiredFor.includes('STUDENT')}
                            onChange={e => {
                              const updated = e.target.checked 
                                ? [...categoryForm.requiredFor, 'STUDENT']
                                : categoryForm.requiredFor.filter(r => r !== 'STUDENT');
                              setCategoryForm({...categoryForm, requiredFor: updated});
                            }}
                          />
                          Student
                        </label>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={categoryForm.requiredFor.includes('TEACHER')}
                            onChange={e => {
                              const updated = e.target.checked 
                                ? [...categoryForm.requiredFor, 'TEACHER']
                                : categoryForm.requiredFor.filter(r => r !== 'TEACHER');
                              setCategoryForm({...categoryForm, requiredFor: updated});
                            }}
                          />
                          Teacher
                        </label>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={categoryForm.requiredFor.includes('STAFF')}
                            onChange={e => {
                              const updated = e.target.checked 
                                ? [...categoryForm.requiredFor, 'STAFF']
                                : categoryForm.requiredFor.filter(r => r !== 'STAFF');
                              setCategoryForm({...categoryForm, requiredFor: updated});
                            }}
                          />
                          Staff
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="dark:text-gray-200">Expiry (months, optional)</Label>
                      <Input 
                        type="number"
                        value={categoryForm.expiryMonths}
                        onChange={e => setCategoryForm({...categoryForm, expiryMonths: e.target.value})}
                        placeholder="e.g., 12"
                      />
                    </div>
                    <Button type="submit" className="w-full">Save Category</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No categories found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{cat.displayName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.name}</p>
                          {cat.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{cat.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {cat.requiredFor.map(rf => (
                          <Badge key={rf} variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">{rf}</Badge>
                        ))}
                        {cat.isRequired && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">Required</Badge>
                        )}
                        {cat.expiryMonths && (
                          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">{cat.expiryMonths} months</Badge>
                        )}
                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">{cat._count?.documents || 0} docs</Badge>
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