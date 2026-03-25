'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserPlus } from 'lucide-react';
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
      const res = await fetch('/api/sms/staff');
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
      const res = await fetch(`/api/sms/staff?id=${id}`, {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Non-Teaching Staff</h1>
          <p className="text-gray-500">Manage administrative and support staff</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          if (!open) handleCancel();
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
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
