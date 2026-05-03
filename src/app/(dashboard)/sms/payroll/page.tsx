'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Send, Users, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';
import { calculateMonthlyPayroll } from '@/lib/nigeria-tax';
import { authFetch } from '@/lib/auth-fetch';

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  basicSalary?: number;
}

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  category: string;
  basicSalary?: number;
}

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  totalEarnings: number;
  pensionDeduction: number;
  taxDeduction: number;
  nhfDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  employeeType: string;
  teacherId?: string;
  staffId?: string;
  teacher?: { id: string; firstName: string; lastName: string; employeeId: string };
  staff?: { id: string; firstName: string; lastName: string; employeeId: string };
}

interface FormData {
  employeeType: 'TEACHER' | 'STAFF';
  teacherId: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  pensionRate: string;
  taxRate: string;
  nhfRate: string;
  otherDeductions: string;
}

const getInitialFormData = (): FormData => ({
  employeeType: 'TEACHER',
  teacherId: '',
  staffId: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  basicSalary: '',
  housingAllowance: '10000',
  transportAllowance: '5000',
  otherAllowances: '0',
  pensionRate: '8',
  taxRate: '20',
  nhfRate: '2.5',
  otherDeductions: '0',
});

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TEACHER' | 'STAFF'>('TEACHER');
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRemitaDialog, setShowRemitaDialog] = useState(false);
  const [remitaProcessing, setRemitaProcessing] = useState(false);
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [bulkFormData, setBulkFormData] = useState({
    employeeType: 'TEACHER' as 'TEACHER' | 'STAFF',
    branchId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    overrideBasicSalary: '',
    overrideHousingAllowance: '10000',
    overrideTransportAllowance: '5000',
  });
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, staffRes, payrollRes, branchesRes] = await Promise.all([
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/staff'),
        authFetch('/api/sms/payroll'),
        authFetch('/api/sms/branches'),
      ]);
      
      const teachersData = await teachersRes.json();
      const staffData = await staffRes.json();
      const payrollData = await payrollRes.json();
      const branchesData = await branchesRes.json();
      
      const teachersList = Array.isArray(teachersData) ? teachersData : (Array.isArray(teachersData.data) ? teachersData.data : []);
      const staffList = Array.isArray(staffData) ? staffData : (Array.isArray(staffData.data) ? staffData.data : []);
      const payrollList = Array.isArray(payrollData) ? payrollData : (Array.isArray(payrollData.data) ? payrollData.data : []);
      const branchesList = Array.isArray(branchesData) ? branchesData : (Array.isArray(branchesData.data) ? branchesData.data : []);
      
      setTeachers(teachersList);
      setStaff(staffList);
      setPayrolls(payrollList);
      setBranches(branchesList);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = () => {
    const basicSalary = parseFloat(formData.basicSalary) || 0;
    const housingAllowance = parseFloat(formData.housingAllowance) || 0;
    const transportAllowance = parseFloat(formData.transportAllowance) || 0;
    const otherAllowances = parseFloat(formData.otherAllowances) || 0;
    const pensionRate = parseFloat(formData.pensionRate);
    const nhfRate = parseFloat(formData.nhfRate);
    
    const result = calculateMonthlyPayroll(
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      pensionRate,
      true,
      nhfRate
    );
    
    return {
      totalEarnings: result.grossEarnings,
      totalDeductions: result.totalDeductions,
      netPay: result.netPay,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const calc = calculatePayroll();
    const employeeId = formData.employeeType === 'TEACHER' ? formData.teacherId : formData.staffId;
    
    try {
      const res = await authFetch('/api/sms/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeType: formData.employeeType,
          teacherId: formData.employeeType === 'TEACHER' ? employeeId : null,
          staffId: formData.employeeType === 'STAFF' ? employeeId : null,
          month: formData.month,
          year: formData.year,
          basicSalary: parseFloat(formData.basicSalary),
          housingAllowance: parseFloat(formData.housingAllowance),
          transportAllowance: parseFloat(formData.transportAllowance),
          otherAllowances: parseFloat(formData.otherAllowances),
          pensionDeduction: calc.totalEarnings * (parseFloat(formData.pensionRate) / 100),
          taxDeduction: calc.taxDetails?.monthlyTax || 0,
          nhfDeduction: calc.totalEarnings * (parseFloat(formData.nhfRate) / 100),
          otherDeductions: parseFloat(formData.otherDeductions),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData(getInitialFormData());
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create payroll');
      }
    } catch (err) {
      console.error('Failed to create payroll:', err);
    }
  };

  const handleBulkSubmit = async () => {
    setBulkProcessing(true);
    try {
      const res = await authFetch('/api/sms/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeType: bulkFormData.employeeType,
          branchId: bulkFormData.branchId || undefined,
          month: bulkFormData.month,
          year: bulkFormData.year,
          overrideBasicSalary: bulkFormData.overrideBasicSalary ? parseFloat(bulkFormData.overrideBasicSalary) : undefined,
          overrideHousingAllowance: parseFloat(bulkFormData.overrideHousingAllowance),
          overrideTransportAllowance: parseFloat(bulkFormData.overrideTransportAllowance),
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Processed: ${data.processed}, Failed: ${data.failed}`);
        setShowBulkForm(false);
        fetchData();
      } else {
        alert(data.error || 'Bulk processing failed');
      }
    } catch (err) {
      console.error('Bulk payroll error:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleStatusChange = async (payrollId: string, action: string, reference?: string) => {
    try {
      const res = await authFetch('/api/sms/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollId, action, paymentReference: reference }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update payroll:', err);
    }
  };

  const handleRemitaPayment = async () => {
    const approvedPayrolls = payrolls.filter(p => p.status === 'APPROVED');
    if (approvedPayrolls.length === 0) return;
    
    setRemitaProcessing(true);
    try {
      const res = await authFetch('/api/sms/payroll/remita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disburse',
          payrollIds: approvedPayrolls.map(p => p.id),
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Payment initiated! Processed: ${data.processed}, Failed: ${data.failed}`);
        setShowRemitaDialog(false);
        fetchData();
      }
    } catch (err) {
      console.error('Remita payment error:', err);
    } finally {
      setRemitaProcessing(false);
    }
  };

  const filteredPayrolls = payrolls.filter(p => p.employeeType === activeTab);
  const approvedCount = payrolls.filter(p => p.status === 'APPROVED').length;
  const employeeList = activeTab === 'TEACHER' ? teachers : staff;
  const selectedEmployee = activeTab === 'TEACHER' 
    ? teachers.find(t => t.id === formData.teacherId)
    : staff.find(s => s.id === formData.staffId);

  const calc = calculatePayroll();

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
          <h1 className="text-2xl font-bold dark:text-white">Payroll Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage staff salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkForm(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Run
          </Button>
          <Link href="/sms/payroll/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Run Monthly Payroll</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Type</label>
                    <Select 
                      value={formData.employeeType} 
                      onValueChange={(v: 'TEACHER' | 'STAFF') => setFormData({ ...formData, employeeType: v, teacherId: '', staffId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                        <SelectItem value="STAFF">Non-Teaching Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Employee</label>
                    <Select 
                      value={formData.employeeType === 'TEACHER' ? formData.teacherId : formData.staffId}
                      onValueChange={(v) => {
                        const employee = formData.employeeType === 'TEACHER' 
                          ? teachers.find(t => t.id === v)
                          : staff.find(s => s.id === v);
                        setFormData({ 
                          ...formData, 
                          teacherId: formData.employeeType === 'TEACHER' ? v : formData.teacherId,
                          staffId: formData.employeeType === 'STAFF' ? v : formData.staffId,
                          basicSalary: employee?.basicSalary?.toString() || formData.basicSalary
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Period</label>
                    <div className="flex gap-2">
                      <Select value={formData.month.toString()} onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        className="w-24" 
                        value={formData.year} 
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Earnings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Basic Salary *</label>
                      <Input 
                        type="number" 
                        value={formData.basicSalary} 
                        onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Housing Allowance</label>
                      <Input 
                        type="number" 
                        value={formData.housingAllowance} 
                        onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Transport Allowance</label>
                      <Input 
                        type="number" 
                        value={formData.transportAllowance} 
                        onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Other Allowances</label>
                      <Input 
                        type="number" 
                        value={formData.otherAllowances} 
                        onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Deductions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pension (%)</label>
                      <Input 
                        type="number" 
                        value={formData.pensionRate} 
                        onChange={(e) => setFormData({ ...formData, pensionRate: e.target.value })}
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax (%)</label>
                      <Input 
                        type="number" 
                        value={formData.taxRate} 
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">NHF (%)</label>
                      <Input 
                        type="number" 
                        value={formData.nhfRate} 
                        onChange={(e) => setFormData({ ...formData, nhfRate: e.target.value })}
                        placeholder="2.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Earnings:</span>
                    <span className="font-medium">{calc.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions:</span>
                    <span className="font-medium text-red-600">-{calc.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Net Pay:</span>
                    <span className="text-green-600">{calc.netPay.toLocaleString()}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit">Generate Payroll</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => setShowRemitaDialog(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Pay via Remita ({approvedCount})
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 px-4 ${activeTab === 'TEACHER' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('TEACHER')}
        >
          <GraduationCap className="h-4 w-4 inline mr-2" />
          Teachers ({payrolls.filter(p => p.employeeType === 'TEACHER').length})
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'STAFF' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('STAFF')}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Non-Teaching Staff ({payrolls.filter(p => p.employeeType === 'STAFF').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold">{filteredPayrolls.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">
            ₦{filteredPayrolls.reduce((sum, p) => sum + (p.totalEarnings || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">
            ₦{filteredPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Net Pay</p>
          <p className="text-2xl font-bold text-blue-600">
            ₦{filteredPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {filteredPayrolls.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No payroll records found</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>Run Payroll</Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Employee</th>
                <th className="text-left p-3">Period</th>
                <th className="text-right p-3">Basic</th>
                <th className="text-right p-3">Earnings</th>
                <th className="text-right p-3">Deductions</th>
                <th className="text-right p-3">Net Pay</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.map((record) => {
                const employee = record.employeeType === 'TEACHER' ? record.teacher : record.staff;
                return (
                  <tr key={record.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{employee?.firstName} {employee?.lastName}</p>
                        <p className="text-xs text-gray-500">{employee?.employeeId}</p>
                      </div>
                    </td>
                    <td className="p-3">{months[record.month - 1]} {record.year}</td>
                    <td className="text-right p-3">₦{record.basicSalary.toLocaleString()}</td>
                    <td className="text-right p-3 text-green-600">₦{record.totalEarnings?.toLocaleString()}</td>
                    <td className="text-right p-3 text-red-600">-₦{record.totalDeductions?.toLocaleString()}</td>
                    <td className="text-right p-3 font-bold">₦{record.netPay?.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                        record.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        record.status === 'PAID' ? 'bg-green-100 text-green-700' : ''
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {record.status === 'DRAFT' && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(record.id, 'approve')}>
                            Approve
                          </Button>
                        )}
                        {record.status === 'APPROVED' && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(record.id, 'markPaid', `PAY-${Date.now()}`)}>
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showBulkForm} onOpenChange={setShowBulkForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Payroll Run</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee Type</label>
              <Select 
                value={bulkFormData.employeeType} 
                onValueChange={(v: 'TEACHER' | 'STAFF') => setBulkFormData({ ...bulkFormData, employeeType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">All Teachers</SelectItem>
                  <SelectItem value="STAFF">All Non-Teaching Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch (Optional - leave empty for all)</label>
              <Select 
                value={bulkFormData.branchId || 'all'} 
                onValueChange={(v) => setBulkFormData({ ...bulkFormData, branchId: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <Select value={bulkFormData.month.toString()} onValueChange={(v) => setBulkFormData({ ...bulkFormData, month: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <Input 
                  type="number" 
                  value={bulkFormData.year} 
                  onChange={(e) => setBulkFormData({ ...bulkFormData, year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Override Values (Optional - leave empty to use employee defaults)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1">Basic Salary</label>
                  <Input 
                    type="number" 
                    placeholder="Use default"
                    value={bulkFormData.overrideBasicSalary}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, overrideBasicSalary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Housing</label>
                  <Input 
                    type="number" 
                    value={bulkFormData.overrideHousingAllowance}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, overrideHousingAllowance: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Transport</label>
                  <Input 
                    type="number" 
                    value={bulkFormData.overrideTransportAllowance}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, overrideTransportAllowance: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkForm(false)}>Cancel</Button>
            <Button onClick={handleBulkSubmit} disabled={bulkProcessing}>
              {bulkProcessing ? 'Processing...' : 'Run Bulk Payroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemitaDialog} onOpenChange={setShowRemitaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay via Remita</DialogTitle>
          </DialogHeader>
          <p>Process payment for {approvedCount} approved payroll records via Remita?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemitaDialog(false)}>Cancel</Button>
            <Button onClick={handleRemitaPayment} disabled={remitaProcessing}>
              {remitaProcessing ? 'Processing...' : 'Process Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}