'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { BackButton } from '@/components/BackButton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  billingCycle: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  description: string | null;
  plan: {
    id: string;
    name: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
  };
  payments: any[];
}

export default function TenantInvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('PAYSTACK');

  useEffect(() => {
    if (!authLoading) {
      loadInvoices();
    }
  }, [authLoading]);

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/tenant/invoices');
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    
    setPaying(true);
    try {
      const res = await fetch('/api/tenant/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          invoiceId: selectedInvoice.id,
          gateway: paymentGateway,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        alert(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initialize payment');
    } finally {
      setPaying(false);
      setShowPayDialog(false);
    }
  };

  const handleViewReceipt = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowReceiptDialog(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.plan.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please login to view your invoices</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subscription Invoices</h1>
          <p className="text-gray-500">View and pay your subscription bills</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.plan.displayName}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>
                      {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPayDialog(true);
                            }}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay Now
                          </Button>
                        )}
                        {invoice.payments.some(p => p.status === 'COMPLETED') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReceipt(invoice)}
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              Select your preferred payment method
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan:</span>
                  <span className="font-medium">{selectedInvoice.plan.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Gateway</label>
                <Select value={paymentGateway} onValueChange={setPaymentGateway}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYSTACK">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Paystack
                      </div>
                    </SelectItem>
                    <SelectItem value="FLUTTERWAVE">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        Flutterwave
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayInvoice} disabled={paying}>
              {paying ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="text-center border-b pb-3 mb-3">
                  <h3 className="font-bold text-lg">PCC Educational Solutions</h3>
                  <p className="text-sm text-gray-500">Lagos, Nigeria</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Receipt #:</span>
                  <span className="font-medium">
                    {selectedInvoice.payments.find(p => p.status === 'COMPLETED')?.receiptNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoice #:</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{formatDate(new Date().toISOString())}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-400 mt-4">
                  Thank you for your payment!
                </div>
              </div>
              
              <Button className="w-full" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
