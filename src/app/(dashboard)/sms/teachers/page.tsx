'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import { BackButton } from '@/components/BackButton';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  specialty?: string;
  branchId?: string;
  status?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [teachersRes, branchesRes] = await Promise.all([
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/branches').catch(() => ({ ok: false, json: () => Promise.resolve({ branches: [] }) })),
      ]);
      
      const [teachersData, branchesData] = await Promise.all([
        teachersRes.json(),
        branchesRes.json().catch(() => ({ branches: [] })),
      ]);
      
      setTeachers(teachersData.teachers || teachersData || []);
      setBranches(branchesData.branches || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredTeachers = useMemo(() => {
    let result = teachers;
    
    if (selectedBranch) {
      result = result.filter(t => t.branchId === selectedBranch);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.firstName.toLowerCase().includes(query) ||
        t.lastName.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query) ||
        t.employeeId?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [teachers, selectedBranch, searchQuery]);

  const handleExportExcel = () => {
    const data = filteredTeachers.map(t => ({
      Name: `${t.firstName} ${t.lastName}`,
      Email: t.email || '',
      EmployeeID: t.employeeId || '',
      Specialty: t.specialty || '',
      Status: t.status || 'ACTIVE',
    }));
    exportToExcel(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'EmployeeID', label: 'Employee ID' },
      { key: 'Specialty', label: 'Specialty' },
      { key: 'Status', label: 'Status' },
    ], `teachers_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const data = filteredTeachers.map(t => ({
      Name: `${t.firstName} ${t.lastName}`,
      Email: t.email || '',
      EmployeeID: t.employeeId || '',
      Specialty: t.specialty || '',
      Status: t.status || 'ACTIVE',
    }));
    exportToPDF(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'EmployeeID', label: 'Employee ID' },
      { key: 'Specialty', label: 'Specialty' },
      { key: 'Status', label: 'Status' },
    ], `teachers_${new Date().toISOString().split('T')[0]}`, 'Teachers List');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (!showFilters) {
      setSelectedBranch('');
      setSearchQuery('');
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
            <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage teacher records</p>
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
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}</p>
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
            href="/sms/teachers/new"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Add Teacher
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Specialty</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No teachers found
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.employeeId || '-'}</td>
                  <td className="px-6 py-3">
                    <Link href={`/sms/teachers/${teacher.id}`} className="text-blue-600 hover:underline">
                      {teacher.firstName} {teacher.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.email || '-'}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{teacher.specialty || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      teacher.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {teacher.status || 'ACTIVE'}
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