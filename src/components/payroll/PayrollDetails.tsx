'use client';

import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getStatusColor, type PayrollRecord } from '@/types/payroll';

interface PayrollDetailsProps {
  record: PayrollRecord | null;
}

export default function PayrollDetails({ record }: PayrollDetailsProps) {
  if (!record) return null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Payroll Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              {record.teacher?.firstName?.[0]}{record.teacher?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{record.teacher?.firstName} {record.teacher?.lastName}</p>
            <p className="text-sm text-gray-500">{record.teacher?.employeeId}</p>
          </div>
          <Badge className={getStatusColor(record.status)}>
            {record.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Earnings</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span>Basic Salary</span><span>{formatCurrency(record.basicSalary)}</span></div>
            <div className="flex justify-between"><span>Housing Allowance</span><span>{formatCurrency(record.housingAllowance || 0)}</span></div>
            <div className="flex justify-between"><span>Transport Allowance</span><span>{formatCurrency(record.transportAllowance || 0)}</span></div>
            <div className="flex justify-between"><span>Other Allowances</span><span>{formatCurrency(record.otherAllowances || 0)}</span></div>
            <div className="flex justify-between font-medium border-t pt-2"><span>Total Earnings</span><span>{formatCurrency(record.totalEarnings || 0)}</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Deductions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span>Pension (8%)</span><span>-{formatCurrency(record.pensionDeduction || 0)}</span></div>
            <div className="flex justify-between"><span>PAYE Tax</span><span>-{formatCurrency(record.taxDeduction || 0)}</span></div>
            <div className="flex justify-between"><span>NHF</span><span>-{formatCurrency(record.nhfDeduction || 0)}</span></div>
            <div className="flex justify-between"><span>Other</span><span>-{formatCurrency(record.otherDeductions || 0)}</span></div>
            <div className="flex justify-between font-medium border-t pt-2"><span>Total Deductions</span><span className="text-red-600">-{formatCurrency(record.totalDeductions || 0)}</span></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
          <span className="font-bold">Net Pay</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(record.netPay || 0)}</span>
        </div>
      </div>
    </>
  );
}
