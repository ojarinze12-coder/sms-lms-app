'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserPlus, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  getInitialFormData, 
  type Staff, 
  type StaffFormData 
} from '@/types/staff';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import StaffForm from '@/components/staff/StaffForm';
import StaffStats from '@/components/staff/StaffStats';
import StaffTable from '@/components/staff/StaffTable';

export default function StaffPage() {
  const { user, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>(getInitialFormData());

  useEffect(() => {
    if (!authLoading) {
      fetchStaff();
    }
  }, [authLoading]);

  const fetchStaff = async () => {
    try {
      const res = await authFetch('/api/sms/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = editingStaff ? `/api/sms/staff?id=${editingStaff.id}` : '/api/sms/staff';
      const method = editingStaff ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddDialog(false);
        setEditingStaff(null);
        setFormData(getInitialFormData());
        fetchStaff();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save staff');
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      alert('Failed to save staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      employeeId: staffMember.employeeId || '',
      email: staffMember.email || '',
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      category: staffMember.category || 'OTHER',
      phone: staffMember.phone || '',
      gender: staffMember.gender || '',
      address: staffMember.address || '',
      department: staffMember.department || '',
      position: staffMember.position || '',
      employmentType: staffMember.employmentType || 'FULL_TIME',
      stateOfOrigin: '',
      lgaOfOrigin: '',
      dateOfBirth: '',
      qualification: '',
      experience: '',
      joinDate: '',
      salary: '',
      pensionPin: '',
      nhfNumber: '',
      bvn: '',
      bankName: '',
      bankAccount: '',
      bankSortCode: '',
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const res = await authFetch(`/api/sms/staff?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchStaff();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete staff');
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
      alert('Failed to delete staff');
    }
  };

  const handleExportExcel = () => {
    const data = staff.map(s => ({
      Name: `${s.firstName} ${s.lastName}`,
      Email: s.email || '',
      EmployeeID: s.employeeId || '',
      Category: s.category || '',
      Position: s.position || '',
      Department: s.department || '',
      Status: s.status || 'ACTIVE',
    }));
    exportToExcel(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'EmployeeID', label: 'Employee ID' },
      { key: 'Category', label: 'Category' },
      { key: 'Position', label: 'Position' },
      { key: 'Department', label: 'Department' },
      { key: 'Status', label: 'Status' },
    ], `staff_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const data = staff.map(s => ({
      Name: `${s.firstName} ${s.lastName}`,
      Email: s.email || '',
      EmployeeID: s.employeeId || '',
      Category: s.category || '',
      Position: s.position || '',
      Department: s.department || '',
      Status: s.status || 'ACTIVE',
    }));
    exportToPDF(data, [
      { key: 'Name', label: 'Name' },
      { key: 'Email', label: 'Email' },
      { key: 'EmployeeID', label: 'Employee ID' },
      { key: 'Category', label: 'Category' },
      { key: 'Position', label: 'Position' },
      { key: 'Department', label: 'Department' },
      { key: 'Status', label: 'Status' },
    ], `staff_${new Date().toISOString().split('T')[0]}`, 'Staff List');
  };

  const handleCancel = () => {
    setShowAddDialog(false);
    setEditingStaff(null);
    setFormData(getInitialFormData());
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Non-Teaching Staff</h1>
          <p className="text-gray-500 dark:text-gray-400">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
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
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            if (!open) handleCancel();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
              </DialogHeader>
              <StaffForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isEditing={!!editingStaff}
                submitting={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <StaffStats staff={staff} />

      <StaffTable
        staff={staff}
        search={search}
        filterCategory={filterCategory}
        onSearchChange={setSearch}
        onFilterChange={setFilterCategory}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddClick={() => setShowAddDialog(true)}
      />
    </div>
  );
}
