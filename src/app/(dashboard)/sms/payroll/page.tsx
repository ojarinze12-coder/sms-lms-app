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
} from '@/components/ui/dialog';
import { Plus, Send } from 'lucide-react';
import { calculateMonthlyPayroll } from '@/lib/nigeria-tax';
import type { Teacher, PayrollRecord, PayrollFormData } from '@/types/payroll';
import { getInitialFormData } from '@/types/payroll';
import PayrollForm from '@/components/payroll/PayrollForm';
import PayrollStats from '@/components/payroll/PayrollStats';
import PayrollTable from '@/components/payroll/PayrollTable';
import PayrollDetails from '@/components/payroll/PayrollDetails';
import { authFetch } from '@/lib/auth-fetch';

export default function PayrollPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRemitaDialog, setShowRemitaDialog] = useState(false);
  const [remitaProcessing, setRemitaProcessing] = useState(false);
  const [formData, setFormData] = useState<PayrollFormData>(getInitialFormData());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, payrollRes] = await Promise.all([
        authFetch('/api/sms/teachers'),
        authFetch('/api/sms/payroll')
      ]);
      
      if (!teachersRes.ok || !payrollRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const teachersData = await teachersRes.json();
      const payrollData = await payrollRes.json();
      
      setTeachers(teachersData || []);
      setPayrolls(payrollData || []);
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
    
    try {
      const res = await authFetch('/api/sms/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: formData.teacherId,
          month: formData.month,
          year: formData.year,
          basicSalary: parseFloat(formData.basicSalary),
          housingAllowance: parseFloat(formData.housingAllowance),
          transportAllowance: parseFloat(formData.transportAllowance),
          otherAllowances: parseFloat(formData.otherAllowances),
          pensionDeduction: calc.totalEarnings * (parseFloat(formData.pensionRate) / 100),
          taxDeduction: calc.totalEarnings * (parseFloat(formData.taxRate) / 100),
          nhfDeduction: calc.totalEarnings * (parseFloat(formData.nhfRate) / 100),
          otherDeductions: parseFloat(formData.otherDeductions),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData(getInitialFormData());
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create payroll:', err);
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
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Run Monthly Payroll</DialogTitle>
              </DialogHeader>
              <PayrollForm
                teachers={teachers}
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setFormData(getInitialFormData());
                }}
                calculatePayroll={calculatePayroll}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => setShowRemitaDialog(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Pay via Remita ({payrolls.filter(p => p.status === 'APPROVED').length})
          </Button>
        </div>
      </div>

      <PayrollStats payrolls={payrolls} />

      <PayrollTable
        payrolls={payrolls}
        onViewDetails={(record) => {
          setSelectedPayroll(record);
          setShowDetails(true);
        }}
        onApprove={(id) => handleStatusChange(id, 'approve')}
        onMarkPaid={(id) => handleStatusChange(id, 'markPaid', `PAY-${Date.now()}`)}
      />

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <PayrollDetails record={selectedPayroll} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
