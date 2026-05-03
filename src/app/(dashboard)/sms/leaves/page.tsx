'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock,
  User,
  Filter
} from 'lucide-react';

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  category?: string;
}

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

const leaveTypes = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'EXAM_DUTY', label: 'Exam Duty' },
  { value: 'OTHER', label: 'Other' },
];

export default function LeavesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    teacherId: '',
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, staffRes, leavesRes] = await Promise.all([
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/staff'),
        authFetch('/api/sms/leaves')
      ]);
      
      let teachersData: Teacher[] = [];
      let staffData: Staff[] = [];
      let leavesData: any[] = [];
      
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        teachersData = Array.isArray(data) ? data : [];
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        staffData = Array.isArray(data) ? data : [];
      }
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        leavesData = Array.isArray(data) ? data : [];
      }
      
      setTeachers(teachersData);
      setStaff(staffData);
      setLeaves(leavesData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await authFetch('/api/sms/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        fetchData();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create leave request');
      }
    } catch (err) {
      console.error('Failed to create leave:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      teacherId: '',
      leaveType: 'ANNUAL',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const handleStatusChange = async (leaveId: string, action: 'approve' | 'reject') => {
    try {
      const res = await authFetch('/api/sms/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, action }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SICK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      CASUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      ANNUAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      MATERNITY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      PATERNITY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      UNPAID: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      EMERGENCY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      EXAM_DUTY: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filterStatus === 'all') return true;
    return leave.status === filterStatus;
  });

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Leave Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage staff leave requests and approvals</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Request Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Select Employee</label>
                <Select value={formData.teacherId} onValueChange={(v) => setFormData({...formData, teacherId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Teaching Staff</div>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.employeeId})
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Non-Teaching Staff</div>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Leave Type</label>
                <Select value={formData.leaveType} onValueChange={(v) => setFormData({...formData, leaveType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-200">Start Date</label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      startDate: e.target.value,
                      endDate: e.target.value > formData.endDate ? e.target.value : formData.endDate
                    })} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-200">End Date</label>
                  <Input 
                    type="date" 
                    value={formData.endDate} 
                    min={formData.startDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Duration: <span className="font-bold">{calculateDays(formData.startDate, formData.endDate)} days</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Reason</label>
                <textarea 
                  className="w-full border rounded-lg p-3 min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" 
                  placeholder="Enter reason for leave..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold dark:text-white">{leaves.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="dark:text-white">Leave Requests</CardTitle>
            <CardDescription className="dark:text-gray-400">View and manage all leave requests</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p>No leave requests found</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                Request Leave
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-2 dark:text-gray-300">Employee</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Leave Type</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Start Date</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">End Date</th>
                    <th className="text-center py-3 px-2 dark:text-gray-300">Days</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Reason</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {leave.teacher?.firstName?.[0]}{leave.teacher?.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm dark:text-white">{leave.teacher?.firstName} {leave.teacher?.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{leave.teacher?.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leaveTypes.find(t => t.value === leave.leaveType)?.label || leave.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm dark:text-gray-300">{formatDate(leave.startDate)}</td>
                      <td className="py-3 px-2 text-sm dark:text-gray-300">{formatDate(leave.endDate)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-medium dark:text-white">{leave.days}</span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                          {leave.reason}
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        {leave.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                              onClick={() => handleStatusChange(leave.id, 'approve')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => handleStatusChange(leave.id, 'reject')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
