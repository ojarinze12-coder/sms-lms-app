'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Receipt,
  Building,
  Wallet
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  dueDate: string | null;
  academicYear: {
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
  paidAt: string | null;
  referenceNo: string | null;
  student: {
    studentId: string;
    firstName: string;
    lastName: string;
  };
  feeStructure: {
    name: string;
  };
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export default function FeesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranch, branches } = useBranch();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    amount: '',
    type: 'TUITION',
    category: 'MANDATORY',
    academicYearId: '',
    dueDate: '',
    branchId: '',
    tierId: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeId: '',
    amount: '',
    method: 'CASH',
    transactionId: '',
    notes: '',
  });

  useEffect(() => {
    fetchFeeStructures();
    fetchPayments();
    fetchAcademicYears();
    fetchTiers();
  }, [selectedBranch]);

  async function fetchFeeStructures() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch.id);
      const url = '/api/sms/fees' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (!res.ok) {
        console.error('Fee structures API error:', res.status);
        setFeeStructures([]);
        return;
      }
      const data = await res.json();
      setFeeStructures(Array.isArray(data.feeStructures) ? data.feeStructures : []);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch.id);
      const url = '/api/sms/fees/payments' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (!res.ok) {
        console.error('Payments API error:', res.status);
        setPayments([]);
        return;
      }
      const data = await res.json();
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    }
  }

  async function fetchAcademicYears() {
    try {
      const res = await authFetch('/api/sms/academic-years');
      if (!res.ok) {
        console.error('Academic years API error:', res.status);
        setAcademicYears([]);
        return;
      }
      const data = await res.json();
      const years = data?.years || data || [];
      setAcademicYears(Array.isArray(years) ? years : []);
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
      setAcademicYears([]);
    }
  }

  async function fetchTiers() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch.id);
      const url = '/api/sms/tiers' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (!res.ok) {
        console.error('Tiers API error:', res.status);
        setTiers([]);
        return;
      }
      const data = await res.json();
      setTiers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
      setTiers([]);
    }
  }

  async function fetchStudents() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch.id);
      params.set('limit', '50');
      const url = '/api/sms/students?' + params.toString();
      const res = await authFetch(url);
      if (!res.ok) {
        console.error('Students API error:', res.status);
        setStudents([]);
        return;
      }
      const data = await res.json();
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    }
  }

  async function createFeeStructure() {
    if (!newFee.name || !newFee.amount || !newFee.academicYearId) {
      toast({ variant: 'destructive', description: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFee.name,
          amount: parseFloat(newFee.amount),
          type: newFee.type,
          category: newFee.category,
          academicYearId: newFee.academicYearId,
          dueDate: newFee.dueDate || null,
          branchId: newFee.branchId || null,
          tierId: newFee.tierId || null,
        }),
      });

      const data = await res.json();
      if (data.feeStructure) {
        toast({ description: 'Fee structure created successfully' });
        setShowAddDialog(false);
        setNewFee({
          name: '',
          amount: '',
          type: 'TUITION',
          category: 'MANDATORY',
          academicYearId: '',
          dueDate: '',
          branchId: '',
          tierId: '',
        });
        fetchFeeStructures();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to create fee structure' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to create fee structure' });
    } finally {
      setLoading(false);
    }
  }

  async function recordPayment() {
    if (!paymentForm.studentId || !paymentForm.feeId || !paymentForm.amount) {
      toast({ variant: 'destructive', description: 'Please fill in student, fee structure, and amount' });
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record',
          studentId: paymentForm.studentId,
          feeId: paymentForm.feeId,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          transactionId: paymentForm.transactionId || null,
          status: 'COMPLETED',
          gatewayResponse: { manual: true },
        }),
      });

      const data = await res.json();
      if (data.payment) {
        toast({ description: 'Payment recorded successfully' });
        setShowPaymentDialog(false);
        setPaymentForm({
          studentId: '',
          feeId: '',
          amount: '',
          method: 'CASH',
          transactionId: '',
          notes: '',
        });
        fetchPayments();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to record payment' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to record payment' });
    } finally {
      setLoading(false);
    }
  }

  const totalExpected = feeStructures.reduce((sum, fee) => sum + fee.amount, 0);
  const totalCollected = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

  const feeTypeLabels: Record<string, string> = {
    TUITION: 'Tuition',
    REGISTRATION: 'Registration',
    EXAM: 'Exam',
    TRANSPORT: 'Transport',
    HOSTEL: 'Hostel',
    LIBRARY: 'Library',
    UNIFORM: 'Uniform',
    EXTRA_CURRICULAR: 'Extra Curricular',
    LEVY: 'Levy',
    BOOK: 'Books',
    PTA: 'PTA',
    OTHER: 'Other',
  };

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    REFUNDED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Fee Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage school fees, payments, and generate invoices</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPaymentDialog} onOpenChange={(open) => { setShowPaymentDialog(open); if (open) fetchStudents(); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Receipt className="w-4 h-4 mr-2" />
                Make Fee Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Make Fee Payment</DialogTitle>
                <DialogDescription>Record a manual fee payment (Cash, Cheque, Bank Transfer)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Student</label>
                  <Select value={paymentForm.studentId} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, studentId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.lastName} {student.firstName} ({student.studentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fee Structure</label>
                  <Select value={paymentForm.feeId} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, feeId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeStructures.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} - {formatCurrency(fee.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount (₦)</label>
                    <Input 
                      type="number"
                      placeholder="50000"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Payment Method</label>
                    <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, method: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="POS">POS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Transaction Reference</label>
                  <Input 
                    placeholder="e.g., Cheque No, Teller No, Transfer Ref"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                  <Input 
                    placeholder="Any additional notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button onClick={recordPayment} disabled={loading} className="w-full">
                  {loading ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
              <DialogDescription>Add a new fee type for the academic year</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fee Name</label>
                <Input 
                  placeholder="e.g., Tuition Fee Term 1"
                  value={newFee.name}
                  onChange={(e) => setNewFee(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (₦)</label>
                  <Input 
                    type="number"
                    placeholder="50000"
                    value={newFee.amount}
                    onChange={(e) => setNewFee(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fee Type</label>
                  <Select value={newFee.type} onValueChange={(v) => setNewFee(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUITION">Tuition</SelectItem>
                      <SelectItem value="REGISTRATION">Registration</SelectItem>
                      <SelectItem value="EXAM">Exam</SelectItem>
                      <SelectItem value="TRANSPORT">Transport</SelectItem>
                      <SelectItem value="HOSTEL">Hostel</SelectItem>
                      <SelectItem value="LIBRARY">Library</SelectItem>
                      <SelectItem value="UNIFORM">Uniform</SelectItem>
                      <SelectItem value="LEVY">Levy</SelectItem>
                      <SelectItem value="BOOK">Books</SelectItem>
                      <SelectItem value="PTA">PTA</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Academic Year</label>
                  <Select value={newFee.academicYearId} onValueChange={(v) => setNewFee(prev => ({ ...prev, academicYearId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date</label>
                  <Input 
                    type="date"
                    value={newFee.dueDate}
                    onChange={(e) => setNewFee(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Branch</label>
                  <Select value={newFee.branchId || 'all'} onValueChange={(v) => setNewFee(prev => ({ ...prev, branchId: v === 'all' ? '' : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tier</label>
                  <Select value={newFee.tierId || 'all'} onValueChange={(v) => setNewFee(prev => ({ ...prev, tierId: v === 'all' ? '' : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createFeeStructure} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Fee Structure'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalExpected)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Expected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalCollected)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalExpected - totalCollected)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{pendingPayments}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structures */}
      <Card className="dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Fee Structures</CardTitle>
          <CardDescription className="dark:text-gray-400">Active fee types for the academic year</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">Fee Name</TableHead>
                <TableHead className="dark:text-gray-300">Type</TableHead>
                <TableHead className="dark:text-gray-300">Tier</TableHead>
                <TableHead className="dark:text-gray-300">Branch</TableHead>
                <TableHead className="dark:text-gray-300">Amount</TableHead>
                <TableHead className="dark:text-gray-300">Due Date</TableHead>
                <TableHead className="dark:text-gray-300">Academic Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructures.map((fee) => (
                <TableRow key={fee.id} className="dark:border-gray-700">
                  <TableCell className="font-medium dark:text-white">{fee.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{feeTypeLabels[fee.type] || fee.type}</Badge>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{(fee as any).tier?.name || '-'}</TableCell>
                  <TableCell className="dark:text-gray-300">{(fee as any).branch?.name || '-'}</TableCell>
                  <TableCell className="dark:text-gray-300">{formatCurrency(fee.amount)}</TableCell>
                  <TableCell className="dark:text-gray-300">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="dark:text-gray-300">{fee.academicYear?.name}</TableCell>
                </TableRow>
              ))}
              {feeStructures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No fee structures created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Recent Payments</CardTitle>
          <CardDescription className="dark:text-gray-400">Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">Date</TableHead>
                <TableHead className="dark:text-gray-300">Student</TableHead>
                <TableHead className="dark:text-gray-300">Fee Type</TableHead>
                <TableHead className="dark:text-gray-300">Amount</TableHead>
                <TableHead className="dark:text-gray-300">Method</TableHead>
                <TableHead className="dark:text-gray-300">Status</TableHead>
                <TableHead className="dark:text-gray-300">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.slice(0, 10).map((payment) => (
                <TableRow key={payment.id} className="dark:border-gray-700">
                  <TableCell className="dark:text-gray-300">
                    {payment.paidAt 
                      ? new Date(payment.paidAt).toLocaleDateString() 
                      : '-'}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {payment.student.firstName} {payment.student.lastName}
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{payment.student.studentId}</span>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{payment.feeStructure.name}</TableCell>
                  <TableCell className="font-medium dark:text-white">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{payment.method}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payment.status]}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono dark:text-gray-400">{payment.referenceNo || '-'}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No payments recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
