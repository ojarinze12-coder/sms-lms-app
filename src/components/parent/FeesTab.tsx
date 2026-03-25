'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { formatCurrency, getStatusColor, type FeePayment } from '@/types/parent';

interface FeesTabProps {
  fees: FeePayment[];
  feeStats: { total: number; paid: number; pending: number };
}

export default function FeesTab({ fees, feeStats }: FeesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Fee Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fees.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No fee records found</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Total Fees</p>
                <p className="text-xl font-bold">{formatCurrency(feeStats.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(feeStats.paid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(feeStats.pending)}</p>
              </div>
            </div>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-2">Description</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Paid</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} className="border-b">
                    <td className="py-3 px-2">
                      <p className="font-medium">{fee.feeStructure.name}</p>
                      <p className="text-xs text-gray-500">{fee.feeStructure.term?.name} {fee.feeStructure.academicYear?.name}</p>
                    </td>
                    <td className="py-3 px-2">{formatCurrency(fee.feeStructure.amount)}</td>
                    <td className="py-3 px-2">{formatCurrency(fee.amount)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fee.status)}`}>{fee.status}</span>
                    </td>
                    <td className="py-3 px-2 text-sm">{fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feeStats.pending > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">Make a payment</p>
                  <p className="text-sm text-gray-600">Click to pay {formatCurrency(feeStats.pending)} online</p>
                </div>
                <Button>Pay Now</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
