'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Calendar, 
  Clock, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stats {
  totalStaff: number;
  totalPayroll: number;
  pendingLeaves: number;
  approvedLeaves: number;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  teacher: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

interface PayrollSummary {
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidCount: number;
  pendingCount: number;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStaff: 0,
    totalPayroll: 0,
    pendingLeaves: 0,
    approvedLeaves: 0
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalEarnings: 0,
    totalDeductions: 0,
    netPay: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetchDashboardData();
  }, []);

  const authFetchDashboardData = async () => {
    try {
      const [teachersRes, staffRes, leavesRes, payrollRes] = await Promise.all([
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/staff'),
        authFetch('/api/sms/leaves'),
        authFetch('/api/sms/payroll')
      ]);

      // Teachers
      let teachers: any[] = [];
      if (teachersRes.ok) {
        teachers = await teachersRes.json() || [];
      }

      // Non-teaching staff
      let staff: any[] = [];
      if (staffRes.ok) {
        staff = await staffRes.json() || [];
      }

      // Leaves
      let leavesData: any[] = [];
      if (leavesRes.ok) {
        leavesData = await leavesRes.json() || [];
      }

      // Payroll
      let payrollData: any[] = [];
      if (payrollRes.ok) {
        payrollData = await payrollRes.json() || [];
      }

      const pendingLeaves = leavesData.filter((l: any) => l.status === 'PENDING');
      const approvedLeaves = leavesData.filter((l: any) => l.status === 'APPROVED');

      const totalEarnings = payrollData.reduce((sum: number, p: any) => sum + (p.totalEarnings || 0), 0);
      const totalDeductions = payrollData.reduce((sum: number, p: any) => sum + (p.totalDeductions || 0), 0);
      const netPay = payrollData.reduce((sum: number, p: any) => sum + (p.netPay || 0), 0);
      const paidCount = payrollData.filter((p: any) => p.status === 'PAID').length;
      const pendingCount = payrollData.filter((p: any) => p.status !== 'PAID').length;

      setStats({
        totalStaff: (teachers.length || 0) + (staff.length || 0),
        totalPayroll: payrollData.length || 0,
        pendingLeaves: pendingLeaves.length,
        approvedLeaves: approvedLeaves.length
      });

      setLeaves(pendingLeaves.slice(0, 5));
      setPayrollSummary({ totalEarnings, totalDeductions, netPay, paidCount, pendingCount });
    } catch (err) {
      console.error('Failed to authFetch HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SICK: 'bg-red-100 text-red-700',
      CASUAL: 'bg-blue-100 text-blue-700',
      ANNUAL: 'bg-green-100 text-green-700',
      MATERNITY: 'bg-purple-100 text-purple-700',
      PATERNITY: 'bg-indigo-100 text-indigo-700',
      UNPAID: 'bg-gray-100 text-gray-700',
      EMERGENCY: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject') => {
    try {
      await authFetch('/api/sms/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, action }),
      });
      authFetchDashboardData();
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage staff, leaves, and payroll</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sms/payroll">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
            </Button>
          </Link>
          <Link href="/sms/leaves">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Leave Management
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-3xl font-bold">{stats.totalStaff}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Leaves</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingLeaves}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month Payroll</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(payrollSummary.netPay)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="text-3xl font-bold">{payrollSummary.paidCount}/{payrollSummary.paidCount + payrollSummary.pendingCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Leave Requests</CardTitle>
            <Link href="/sms/leaves">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{leave.teacher?.firstName} {leave.teacher?.lastName}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.days} days)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLeaveAction(leave.id, 'approve')}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleLeaveAction(leave.id, 'reject')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payroll Summary</CardTitle>
            <Link href="/sms/payroll">
              <Button variant="ghost" size="sm">
                Manage Payroll <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-bold text-green-600">{formatCurrency(payrollSummary.totalEarnings)}</span>
              </div>
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <span className="text-gray-600">Total Deductions</span>
                <span className="font-bold text-red-600">{formatCurrency(payrollSummary.totalDeductions)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium">Net Pay</span>
                <span className="font-bold text-blue-600">{formatCurrency(payrollSummary.netPay)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sms/teachers">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">Teaching Staff</span>
              </Button>
            </Link>
            <Link href="/sms/staff">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <UserPlus className="h-5 w-5" />
                <span className="text-sm">Non-Teaching Staff</span>
              </Button>
            </Link>
            <Link href="/sms/payroll">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Run Payroll</span>
              </Button>
            </Link>
            <Link href="/sms/leaves">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Leave Requests</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
