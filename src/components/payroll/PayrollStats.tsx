'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { formatCurrency, type PayrollRecord } from '@/types/payroll';

interface PayrollStatsProps {
  payrolls: PayrollRecord[];
}

export default function PayrollStats({ payrolls }: PayrollStatsProps) {
  const stats = {
    total: payrolls.length,
    totalEarnings: payrolls.reduce((sum, p) => sum + (p.totalEarnings || 0), 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
    netPay: payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Payroll</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalEarnings)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalDeductions)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Net Pay</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.netPay)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
