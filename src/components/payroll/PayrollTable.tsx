'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, Check } from 'lucide-react';
import { formatCurrency, getStatusColor, getMonthName, type PayrollRecord } from '@/types/payroll';

interface PayrollTableProps {
  payrolls: PayrollRecord[];
  onViewDetails: (record: PayrollRecord) => void;
  onApprove: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

export default function PayrollTable({
  payrolls,
  onViewDetails,
  onApprove,
  onMarkPaid,
}: PayrollTableProps) {
  if (payrolls.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No payroll records found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Records</CardTitle>
        <CardDescription>View and manage staff payroll</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Employee</th>
                <th className="text-left py-3 px-2">Period</th>
                <th className="text-right py-3 px-2">Basic</th>
                <th className="text-right py-3 px-2">Earnings</th>
                <th className="text-right py-3 px-2">Deductions</th>
                <th className="text-right py-3 px-2">Net Pay</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium">{record.teacher?.firstName} {record.teacher?.lastName}</p>
                      <p className="text-xs text-gray-500">{record.teacher?.employeeId}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {getMonthName(record.month)} {record.year}
                  </td>
                  <td className="text-right py-3 px-2">{formatCurrency(record.basicSalary)}</td>
                  <td className="text-right py-3 px-2 text-green-600">{formatCurrency(record.totalEarnings || 0)}</td>
                  <td className="text-right py-3 px-2 text-red-600">-{formatCurrency(record.totalDeductions || 0)}</td>
                  <td className="text-right py-3 px-2 font-bold">{formatCurrency(record.netPay || 0)}</td>
                  <td className="py-3 px-2">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onViewDetails(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {record.status === 'DRAFT' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onApprove(record.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {record.status === 'APPROVED' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onMarkPaid(record.id)}
                        >
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
