'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Plus, 
  Search, 
  Download,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    name: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
  };
  payments: any[];
}

interface Tenant {
  id: string;
  name: string;
}

export default function AdminBillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [newInvoice, setNewInvoice] = useState({
    tenantId: '',
    billingCycle: 'MONTHLY',
    billingPeriodStart: '',
    billingPeriodEnd: '',
    dueDate: '',
    description: '',
  });

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    try {
      const [invoicesRes, tenantsRes] = await Promise.all([
        fetch('/api/admin/invoices'),
        fetch('/api/admin/tenants'),
      ]);

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }
      
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecurring = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Would create ${data.processed} invoices. ${data.skipped} would be skipped.`);
        if (confirm(`Create ${data.processed} invoices?`)) {
          const confirmRes = await fetch('/api/admin/billing/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dryRun: false }),
          });
          const confirmData = await confirmRes.json();
          alert(`Created ${confirmData.processed} invoices!`);
          loadData();
        }
      } else {
        alert(data.error || 'Failed to generate invoices');
      }
    } catch (error) {
      console.error('Failed to generate invoices:', error);
      alert('Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });

      if (res.ok) {
        alert('Invoice created successfully!');
        setShowCreateDialog(false);
        loadData();
        setNewInvoice({
          tenantId: '',
          billingCycle: 'MONTHLY',
          billingPeriodStart: '',
          billingPeriodEnd: '',
          dueDate: '',
          description: '',
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleViewReceipt = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowReceiptDialog(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.plan.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

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

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access denied. Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Platform Billing</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage tenant subscription invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateRecurring} disabled={generating}>
            <DollarSign className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Recurring Invoices'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingInvoices.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{paidInvoices.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(pendingAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">All Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64 dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
              <TableRow className="dark:bg-gray-700 dark:text-gray-400">
                <TableHead className="dark:text-gray-400">Invoice #</TableHead>
                <TableHead className="dark:text-gray-400">School</TableHead>
                <TableHead className="dark:text-gray-400">Plan</TableHead>
                <TableHead className="dark:text-gray-400">Amount</TableHead>
                <TableHead className="dark:text-gray-400">Billing Period</TableHead>
                <TableHead className="dark:text-gray-400">Due Date</TableHead>
                <TableHead className="dark:text-gray-400">Status</TableHead>
                <TableHead className="text-right dark:text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="dark:hover:bg-gray-700">
                    <TableCell className="font-medium dark:text-white">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="dark:text-gray-300">{invoice.tenant.name}</TableCell>
                    <TableCell className="dark:text-gray-300">{invoice.plan.displayName}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>
                      {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Generate a new subscription invoice for a tenant
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Tenant</label>
              <Select value={newInvoice.tenantId} onValueChange={(v) => setNewInvoice({ ...newInvoice, tenantId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                <Select value={newInvoice.billingCycle} onValueChange={(v) => setNewInvoice({ ...newInvoice, billingCycle: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Period Start</label>
                <Input 
                  type="date" 
                  value={newInvoice.billingPeriodStart}
                  onChange={(e) => setNewInvoice({ ...newInvoice, billingPeriodStart: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Period End</label>
                <Input 
                  type="date" 
                  value={newInvoice.billingPeriodEnd}
                  onChange={(e) => setNewInvoice({ ...newInvoice, billingPeriodEnd: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Input 
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="Invoice description"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Receipt</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                <div className="text-center border-b pb-3 mb-3 dark:border-gray-600">
                  <h3 className="font-bold text-lg dark:text-white">PCC Educational Solutions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lagos, Nigeria</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Invoice #:</span>
                  <span className="font-medium dark:text-white">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">School:</span>
                  <span className="font-medium dark:text-white">{selectedInvoice.tenant.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Date:</span>
                  <span className="font-medium dark:text-white">{formatDate(new Date().toISOString())}</span>
                </div>
                
                <div className="border-t pt-3 mt-3 dark:border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Amount Paid:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                    </span>
                  </div>
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
