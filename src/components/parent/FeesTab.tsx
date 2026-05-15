'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt, FileText, AlertCircle, Download } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil, formatDate, formatStatus, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { formatCurrency, type StudentFeeData } from '@/types/parent';

interface FeesTabProps {
  feeData: StudentFeeData[];
  onPayNow?: (billId: string, studentId: string) => void;
}

export default function FeesTab({ feeData, onPayNow }: FeesTabProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'bills' | 'payments' | 'receipts'>('overview');
  const [paying, setPaying] = useState(false);

  const selectedChild = feeData.find(f => f.studentId === selectedChildId);

  function exportBillsToExcel() {
    if (!selectedChild?.bills.length) return;
    const columns = [
      { key: 'term', label: 'Term' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
    ];
    const data = selectedChild.bills.map(b => ({
      term: b.term,
      academicYear: b.academicYear,
      totalAmount: formatCurrencyUtil(b.totalAmount),
      amountPaid: formatCurrencyUtil(b.amountPaid),
      balance: formatCurrencyUtil(b.balance),
      status: formatStatus(b.status),
    }));
    exportToExcel(data, columns, 'Fee_Bills');
  }

  function exportBillsToPDF() {
    if (!selectedChild?.bills.length) return;
    const columns = [
      { key: 'term', label: 'Term' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
    ];
    const data = selectedChild.bills.map(b => ({
      term: b.term,
      academicYear: b.academicYear,
      totalAmount: formatCurrencyUtil(b.totalAmount),
      amountPaid: formatCurrencyUtil(b.amountPaid),
      balance: formatCurrencyUtil(b.balance),
      status: formatStatus(b.status),
    }));
    exportToPDF(data, columns, 'Fee_Bills', { title: 'Fee Bills Report' });
  }

  function exportPaymentsToExcel() {
    if (!selectedChild?.payments.length) return;
    const columns = [
      { key: 'paidAt', label: 'Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'transactionId', label: 'Reference' },
      { key: 'status', label: 'Status' },
    ];
    const data = selectedChild.payments.map(p => ({
      paidAt: formatDate(p.paidAt),
      amount: formatCurrencyUtil(p.amount),
      method: p.method,
      transactionId: p.transactionId || '-',
      status: formatStatus(p.status),
    }));
    exportToExcel(data, columns, 'Fee_Payments');
  }

  function exportPaymentsToPDF() {
    if (!selectedChild?.payments.length) return;
    const columns = [
      { key: 'paidAt', label: 'Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'transactionId', label: 'Reference' },
      { key: 'status', label: 'Status' },
    ];
    const data = selectedChild.payments.map(p => ({
      paidAt: formatDate(p.paidAt),
      amount: formatCurrencyUtil(p.amount),
      method: p.method,
      transactionId: p.transactionId || '-',
      status: formatStatus(p.status),
    }));
    exportToPDF(data, columns, 'Fee_Payments', { title: 'Payment History' });
  }

  function exportReceiptsToExcel() {
    if (!selectedChild?.receipts.length) return;
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'term', label: 'Term' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'totalPaid', label: 'Amount' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = selectedChild.receipts.map(r => ({
      receiptNo: r.receiptNo,
      term: r.term,
      academicYear: r.academicYear,
      totalPaid: formatCurrencyUtil(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToExcel(data, columns, 'Fee_Receipts');
  }

  function exportReceiptsToPDF() {
    if (!selectedChild?.receipts.length) return;
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'term', label: 'Term' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'totalPaid', label: 'Amount' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = selectedChild.receipts.map(r => ({
      receiptNo: r.receiptNo,
      term: r.term,
      academicYear: r.academicYear,
      totalPaid: formatCurrencyUtil(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToPDF(data, columns, 'Fee_Receipts', { title: 'Payment Receipts' });
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'FULLY_PAID':
      case 'PAID':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'UNPAID':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const totalBilled = feeData.reduce((sum, f) => sum + f.totalBilled, 0);
  const totalPaid = feeData.reduce((sum, f) => sum + f.totalPaid, 0);
  const totalOutstanding = feeData.reduce((sum, f) => sum + f.outstanding, 0);

  if (feeData.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CreditCard className="h-5 w-5" /> Fee Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No fee records found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CreditCard className="h-5 w-5" /> Fee Payments
          </CardTitle>
          <Select value={selectedChildId || feeData[0]?.studentId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select Child" />
            </SelectTrigger>
            <SelectContent>
              {feeData.map(child => (
                <SelectItem key={child.studentId} value={child.studentId}>
                  {child.studentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Billed</p>
            <p className="text-lg md:text-xl font-bold dark:text-white">{formatCurrency(selectedChild?.totalBilled || totalBilled)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
            <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedChild?.totalPaid || totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Balance</p>
            <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedChild?.outstanding || totalOutstanding)}</p>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            {selectedChild && selectedChild.bills.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium dark:text-white">Recent Bills</h4>
                {selectedChild.bills.slice(0, 3).map(bill => (
                  <div key={bill.id} className="p-3 border dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium dark:text-white">{bill.term}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{bill.academicYear}</p>
                      </div>
                      <Badge className={getStatusColor(bill.status)}>{bill.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Billed</p>
                        <p className="font-medium dark:text-white">{formatCurrency(bill.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Paid</p>
                        <p className="font-medium text-green-600">{formatCurrency(bill.amountPaid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Balance</p>
                        <p className="font-medium text-red-600">{formatCurrency(bill.balance)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No bills found</p>
            )}
          </TabsContent>

          <TabsContent value="bills" className="mt-4">
            {selectedChild && selectedChild.bills.length > 0 ? (
              <div className="space-y-4">
                {selectedChild.bills.map(bill => (
                  <div key={bill.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium dark:text-white">{bill.term} - {bill.academicYear}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total: {formatCurrency(bill.totalAmount)} | Paid: {formatCurrency(bill.amountPaid)} | Balance: {formatCurrency(bill.balance)}</p>
                      </div>
                      <Badge className={getStatusColor(bill.status)}>{bill.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="text-left py-2 px-3 text-sm dark:text-gray-300">Component</th>
                            <th className="text-right py-2 px-3 text-sm dark:text-gray-300">Amount</th>
                            <th className="text-right py-2 px-3 text-sm dark:text-gray-300">Paid</th>
                            <th className="text-right py-2 px-3 text-sm dark:text-gray-300">Outstanding</th>
                            <th className="text-center py-2 px-3 text-sm dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item, idx) => (
                            <tr key={idx} className="border-t dark:border-gray-700">
                              <td className="py-2 px-3 dark:text-white">{item.componentName}</td>
                              <td className="py-2 px-3 text-right dark:text-gray-300">{formatCurrency(item.amountDue)}</td>
                              <td className="py-2 px-3 text-right dark:text-gray-300">{formatCurrency(item.amountPaid)}</td>
                              <td className="py-2 px-3 text-right font-medium text-red-600">{formatCurrency(item.outstanding)}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>{item.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No bills found</p>
            )}
            {selectedChild && selectedChild.bills.length > 0 && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={exportBillsToExcel}>
                  <Download className="w-4 h-4 mr-2" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportBillsToPDF}>
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            {selectedChild && selectedChild.payments.length > 0 ? (
              <div className="space-y-4">
                {selectedChild.payments.map(payment => (
                  <div key={payment.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium dark:text-white">{payment.method === 'BANK_TRANSFER' ? 'Bank Transfer' : payment.method === 'CASH' ? 'Cash' : payment.method === 'CARD' ? 'Card Payment' : payment.method}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Date not available'}</p>
                        {payment.transactionId && <p className="text-xs text-gray-400 font-mono">Ref: {payment.transactionId}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>{payment.status}</span>
                      </div>
                    </div>
                    {selectedChild.bills.length > 0 && (
                      <div className="p-3">
                        <p className="text-sm font-medium dark:text-gray-300 mb-2">Components Paid:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedChild.bills.flatMap((b: any) => 
                            b.items.filter((item: any) => item.amountPaid > 0).map((item: any, idx: number) => (
                              <div key={`${b.id}-${idx}`} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="dark:text-white">{item.componentName}</p>
                                <p className="text-green-600">{formatCurrency(item.amountPaid)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No payments recorded yet</p>
              </div>
            )}
            {selectedChild && selectedChild.payments.length > 0 && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={exportPaymentsToExcel}>
                  <Download className="w-4 h-4 mr-2" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportPaymentsToPDF}>
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="receipts" className="mt-4">
            {selectedChild && selectedChild.receipts.length > 0 ? (
              <div className="space-y-4">
                {selectedChild.receipts.map(receipt => (
                  <div key={receipt.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium dark:text-white">{receipt.receiptNo}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{receipt.term} - {receipt.academicYear}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(receipt.generatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(receipt.totalPaid)}</p>
                        <Button size="sm" variant="outline">Download</Button>
                      </div>
                    </div>
                    {selectedChild.bills.length > 0 && (
                      <div className="p-3">
                        <p className="text-sm font-medium dark:text-gray-300 mb-2">Components Covered:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedChild.bills.flatMap((b: any) => 
                            b.items.filter((item: any) => item.amountPaid > 0).map((item: any, idx: number) => (
                              <div key={`${b.id}-${idx}`} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="dark:text-white">{item.componentName}</p>
                                <p className="text-green-600">{formatCurrency(item.amountPaid)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No receipts available</p>
              </div>
            )}
            {selectedChild && selectedChild.receipts.length > 0 && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={exportReceiptsToExcel}>
                  <Download className="w-4 h-4 mr-2" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportReceiptsToPDF}>
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {(selectedChild?.outstanding || totalOutstanding) > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium dark:text-white">Make a payment</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Click to pay {formatCurrency(selectedChild?.outstanding || totalOutstanding)} online</p>
            </div>
            <Button 
              onClick={() => onPayNow?.(selectedChild?.bill?.id, selectedChild?.studentId)} 
              disabled={paying || !onPayNow}
            >
              {paying ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}