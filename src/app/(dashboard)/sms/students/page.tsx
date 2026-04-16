'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';

interface Student {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  branchId?: string;
  enrollments?: { academicClass?: { id?: string; name?: string; tierId?: string; tier?: { name?: string } } }[];
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface AcademicClass {
  id: string;
  name: string;
  tierId: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Reload students and classes when filters change
  useEffect(() => {
    if (!showFilters || loading) return;
    loadStudents();
  }, [selectedBranch, selectedTier, selectedClass]);

  // Reload classes when tier changes
  useEffect(() => {
    if (!selectedTier) return;
    loadClasses();
  }, [selectedTier]);

  async function loadClasses() {
    try {
      const params = new URLSearchParams();
      if (selectedTier) params.set('tierId', selectedTier);
      if (selectedBranch) params.set('branchId', selectedBranch);
      const url = `/api/sms/academic-classes${params.toString() ? '?' + params.toString() : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      const classList = data?.classes || data?.data || data || [];
      setClasses(Array.isArray(classList) ? classList : []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }

  async function loadStudents() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch);
      if (selectedTier) params.set('tierId', selectedTier);
      if (selectedClass) params.set('classId', selectedClass);
      
      const url = `/api/sms/students${params.toString() ? '?' + params.toString() : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      
      let studentList = [];
      if (Array.isArray(data)) {
        studentList = data;
      } else if (Array.isArray(data.students)) {
        studentList = data.students;
      }
      setStudents(studentList);
    } catch (err) {
      console.error('Failed to reload students:', err);
    }
  }

  async function loadData() {
    try {
      console.log('[StudentsPage] Fetching data...');
      
      const studentsRes = await authFetch('/api/sms/students');
      const studentsData = await studentsRes.json();
      console.log('[StudentsPage] Students response:', studentsRes.status, studentsData);
      
      let studentList = [];
      if (studentsData.error) {
        console.error('[StudentsPage] API Error:', studentsData.error);
        setError(studentsData.error);
      } else if (Array.isArray(studentsData)) {
        studentList = studentsData;
      } else if (Array.isArray(studentsData.students)) {
        studentList = studentsData.students;
      }
      setStudents(studentList);
      console.log('[StudentsPage] Loaded', studentList.length, 'students');
      
      // Load tiers
      try {
        const tiersRes = await authFetch('/api/sms/tiers');
        const tiersData = await tiersRes.json();
        const tierList = tiersData?.tiers || tiersData?.data || tiersData || [];
        setTiers(Array.isArray(tierList) ? tierList : []);
      } catch { setTiers([]); }
      
      // Load classes  
      try {
        const classesRes = await authFetch('/api/sms/academic-classes');
        const classesData = await classesRes.json();
        const classList = classesData?.classes || classesData?.data || classesData || [];
        setClasses(Array.isArray(classList) ? classList : []);
      } catch { 
        console.error('[StudentsPage] Failed to load classes');
        setClasses([]); 
      }
      
      // Load branches
      try {
        const branchesRes = await authFetch('/api/sms/branches');
        const branchesData = await branchesRes.json();
        const branchList = branchesData?.branches || [];
        setBranches(Array.isArray(branchList) ? branchList : []);
      } catch { 
        console.error('[StudentsPage] Failed to load branches');
        setBranches([]); 
      }
      
    } catch (err) {
      console.error('[StudentsPage] Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = useMemo(() => {
    let result = students;
    
    if (selectedBranch) {
      result = result.filter(s => s.branchId === selectedBranch);
    }
    
    if (selectedClass) {
      result = result.filter(s => 
        s.enrollments?.some(e => e.academicClass?.id === selectedClass)
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.studentId?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [students, selectedBranch, selectedClass, searchQuery]);

  const handleExportExcel = () => {
    const data = filteredStudents.map(s => ({
      Name: `${s.firstName} ${s.lastName}`,
      Email: s.email || '',
      Phone: s.phone || '',
      Class: s.enrollments?.[0]?.academicClass?.name || '',
      Status: s.status || 'ACTIVE',
    }));
    exportToExcel(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'Phone', label: 'Phone' },
      { key: 'Class', label: 'Class' },
      { key: 'Status', label: 'Status' },
    ], `students_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const data = filteredStudents.map(s => ({
      Name: `${s.firstName} ${s.lastName}`,
      Email: s.email || '',
      Phone: s.phone || '',
      Class: s.enrollments?.[0]?.academicClass?.name || '',
      Status: s.status || 'ACTIVE',
    }));
    exportToPDF(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'Phone', label: 'Phone' },
      { key: 'Class', label: 'Class' },
      { key: 'Status', label: 'Status' },
    ], `students_${new Date().toISOString().split('T')[0]}`, 'Students List');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (!showFilters) {
      setSelectedBranch('');
      setSelectedTier('');
      setSelectedClass('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Students</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage student records</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Students</h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleFilters}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="relative group">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleExportExcel}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
          <Link
            href="/sms/students/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Student
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            {branches.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setSelectedTier('');
                    setSelectedClass('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Branches</option>
                  {(branches || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value);
                  setSelectedClass('');
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Tiers</option>
                {(tiers || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={!selectedTier}
              >
                <option value="">All Classes</option>
                {(classes || [])
                  .filter((c: any) => !selectedTier || c.tierId === selectedTier)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Class</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <Link href={`/sms/students/${student.id}`} className="text-blue-600 hover:underline">
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{student.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{student.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {student.enrollments?.[0]?.academicClass?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}