'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign, CheckCircle, FileText, Receipt, AlertCircle, Clock, CreditCard, Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel, exportToPDF, formatCurrency as formatCurrencyUtil, formatDate, formatStatus } from '@/lib/export-utils';

interface AcademicYear { id: string; name: string; }
interface Term { id: string; name: string; }

const statusColors: Record<string, string> = {
  FULLY_PAID: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  PARTIALLY_PAID: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  UNPAID: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
};

const statusColorsItem: Record<string, string> = {
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  PARTIALLY_PAID: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  UNPAID: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
};

const formatCurrency = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

export default function StudentFeesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [activeTab, setActiveTab] = useState('registration');

  const [regData, setRegData] = useState<any>(null);
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [billData, setBillData] = useState<any>(null);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => { fetchAcademicYears(); }, []);

  async function fetchAcademicYears() {
    try {
      const res = await authFetch('/api/sms/academic-years');
      if (res.ok) {
        const data = await res.json();
        const years = data?.years || data || [];
        setAcademicYears(Array.isArray(years) ? years : []);
        const active = years.find((y: any) => y.isActive);
        if (active) {
          setSelectedYear(active.id);
          fetchTerms(active.id);
        }
      }
    } catch {}
  }

  async function fetchTerms(yearId: string) {
    try {
      const res = await authFetch(`/api/sms/terms?academicYearId=${yearId}`);
      if (res.ok) {
        const data = await res.json();
        const termList = data?.terms || data || [];
        setTerms(Array.isArray(termList) ? termList : []);
        const current = termList.find((t: any) => t.isCurrent);
        if (current) setSelectedTerm(current.id);
      }
    } catch {}
  }

  function fetchRegistration() {
    if (!selectedYear || !selectedTerm) return;
    setLoading(true);
    authFetch(`/api/student/fees/registration?academicYearId=${selectedYear}&termId=${selectedTerm}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setRegData(data);
          if (data.selectedOptionalIds) setSelectedOptionals(data.selectedOptionalIds);
        }
      })
      .catch(() => toast({ variant: 'destructive', description: 'Failed to load registration' }))
      .finally(() => setLoading(false));
  }

  function fetchBill() {
    if (!selectedYear || !selectedTerm) return;
    setLoading(true);
    const params = new URLSearchParams({ academicYearId: selectedYear, termId: selectedTerm });
    authFetch(`/api/student/fees/bill?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setBillData(data); })
      .catch(() => toast({ variant: 'destructive', description: 'Failed to load bill' }))
      .finally(() => setLoading(false));
  }

  function fetchReceipts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedYear) params.set('academicYearId', selectedYear);
    authFetch(`/api/student/fees/receipts?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setReceipts(Array.isArray(data.receipts) ? data.receipts : []); })
      .catch(() => toast({ variant: 'destructive', description: 'Failed to load receipts' }))
      .finally(() => setLoading(false));
  }

  function fetchPayments() {
    const params = new URLSearchParams();
    if (selectedYear) params.set('academicYearId', selectedYear);
    if (selectedTerm) params.set('termId', selectedTerm);
    authFetch(`/api/student/fees/payments?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPayments(Array.isArray(data.payments) ? data.payments : []); })
      .catch(() => {});
  }

  function toggleOptional(id: string) {
    setSelectedOptionals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function initiatePayment() {
    if (!billData?.bill?.id) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          studentId: user?.id,
          billId: billData.bill.id,
        }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        toast({ description: 'Redirecting to payment gateway...' });
        window.location.href = data.paymentLink;
      } else if (data.error) {
        toast({ variant: 'destructive', description: data.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', description: e.message || 'Failed to initiate payment' });
    } finally {
      setLoading(false);
    }
  }

  async function submitRegistration() {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/student/fees/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId: selectedYear, termId: selectedTerm, selectedOptionalComponents: selectedOptionals }),
      });
      const data = await res.json();
      if (data.registration) {
        toast({ description: 'Fee registration submitted successfully!' });
        fetchRegistration();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to submit' });
      }
    } catch { toast({ variant: 'destructive', description: 'Failed to submit registration' }); }
    finally { setSubmitting(false); }
  }

  async function downloadReceipt(receiptId: string, receiptNo: string) {
    try {
      const res = await authFetch('/api/sms/fees/receipts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${receiptNo}.pdf`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { toast({ variant: 'destructive', description: 'Failed to download receipt' }); }
  }

  function exportBillToExcel() {
    if (!billData?.bill?.items) return;
    const columns = [
      { key: 'componentName', label: 'Fee Item' },
      { key: 'amountDue', label: 'Amount Due' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'outstanding', label: 'Outstanding' },
      { key: 'status', label: 'Status' },
    ];
    const data = billData.bill.items.map((item: any) => ({
      componentName: item.componentName,
      amountDue: formatCurrencyUtil(item.amountDue),
      amountPaid: formatCurrencyUtil(item.amountPaid),
      outstanding: formatCurrencyUtil(item.outstanding),
      status: formatStatus(item.status),
    }));
    exportToExcel(data, columns, 'My_Fee_Bill');
    toast({ description: 'Exported to Excel' });
  }

  function exportBillToPDF() {
    if (!billData?.bill?.items) return;
    const columns = [
      { key: 'componentName', label: 'Fee Item' },
      { key: 'amountDue', label: 'Amount Due' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'outstanding', label: 'Outstanding' },
      { key: 'status', label: 'Status' },
    ];
    const data = billData.bill.items.map((item: any) => ({
      componentName: item.componentName,
      amountDue: formatCurrencyUtil(item.amountDue),
      amountPaid: formatCurrencyUtil(item.amountPaid),
      outstanding: formatCurrencyUtil(item.outstanding),
      status: formatStatus(item.status),
    }));
    exportToPDF(data, columns, 'My_Fee_Bill', {
      title: 'My Fee Bill',
      subtitle: `${billData.academicYear?.name || ''} - ${billData.term?.name || ''}`,
    });
    toast({ description: 'Exported to PDF' });
  }

  function exportReceiptsToExcel() {
    if (receipts.length === 0) return;
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'term', label: 'Term' },
      { key: 'totalPaid', label: 'Amount' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = receipts.map(r => ({
      receiptNo: r.receiptNo,
      term: r.term?.name || '-',
      totalPaid: formatCurrencyUtil(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToExcel(data, columns, 'My_Receipts');
    toast({ description: 'Exported to Excel' });
  }

  function exportReceiptsToPDF() {
    if (receipts.length === 0) return;
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'term', label: 'Term' },
      { key: 'totalPaid', label: 'Amount' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = receipts.map(r => ({
      receiptNo: r.receiptNo,
      term: r.term?.name || '-',
      totalPaid: formatCurrencyUtil(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToPDF(data, columns, 'My_Receipts', { title: 'My Payment Receipts' });
    toast({ description: 'Exported to PDF' });
  }

  useEffect(() => {
    if (activeTab === 'registration') fetchRegistration();
    else if (activeTab === 'bill') { fetchBill(); fetchPayments(); }
    else if (activeTab === 'receipts') { fetchReceipts(); fetchPayments(); }
  }, [selectedYear, selectedTerm, activeTab]);

  const mandatoryTotal = regData?.totalMandatory || 0;
  const selectedOptionalTotal = regData?.totalOptional || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">My School Fees</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage your school fee bill and payments</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setTerms([]); setSelectedTerm(''); fetchTerms(v); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Academic Year" /></SelectTrigger>
          <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Term" /></SelectTrigger>
          <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className={`cursor-pointer dark:border-gray-700 ${activeTab === 'registration' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('registration')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${regData?.registration?.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                {regData?.registration?.status === 'CONFIRMED' ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Clock className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <p className="text-sm font-medium dark:text-gray-300">Registration</p>
                <p className="text-lg font-bold dark:text-white">{regData?.registration?.status || 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer dark:border-gray-700 ${activeTab === 'bill' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('bill')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${billData?.bill?.balance <= 0 ? 'bg-green-100 dark:bg-green-900/30' : billData?.exists ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <DollarSign className={`w-6 h-6 ${billData?.bill?.balance <= 0 ? 'text-green-600' : billData?.exists ? 'text-yellow-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm font-medium dark:text-gray-300">Balance</p>
                <p className="text-lg font-bold dark:text-white">{billData?.bill ? formatCurrency(billData.bill.balance) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer dark:border-gray-700 ${activeTab === 'payments' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('payments')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><CreditCard className="w-6 h-6 text-green-600" /></div>
              <div>
                <p className="text-sm font-medium dark:text-gray-300">Payments</p>
                <p className="text-lg font-bold dark:text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer dark:border-gray-700 ${activeTab === 'receipts' ? 'border-blue-500 ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('receipts')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Receipt className="w-6 h-6 text-purple-600" /></div>
              <div>
                <p className="text-sm font-medium dark:text-gray-300">Receipts</p>
                <p className="text-lg font-bold dark:text-white">{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REGISTRATION TAB */}
      {activeTab === 'registration' && regData && (
        <div className="space-y-4">
          <Card className="dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Fee Registration</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {regData.student?.firstName} {regData.student?.lastName} — {regData.student?.class}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {regData.registration?.status === 'CONFIRMED' ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold dark:text-white">Registration Confirmed</h3>
                  <p className="text-gray-500">Your fee selections are locked for this term.</p>
                  <div className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium dark:text-white">Your selections:</p>
                    {regData.mandatoryComponents?.map((c: any) => (
                      <div key={c.id} className="flex justify-between text-sm dark:text-gray-300">
                        <span>{c.name} <Badge variant="outline" className="ml-1 text-xs">Mandatory</Badge></span>
                        <span>{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                    {regData.registration?.selectedOptionalIds?.map((id: string) => {
                      const c = regData.optionalComponents?.find((o: any) => o.id === id);
                      return c ? (
                        <div key={c.id} className="flex justify-between text-sm dark:text-gray-300">
                          <span>{c.name} <Badge className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">Optional</Badge></span>
                          <span>{formatCurrency(c.amount)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="font-medium dark:text-white">Mandatory Fees (pre-selected, cannot be changed)</p>
                    {regData.mandatoryComponents?.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.type}</p>
                        </div>
                        <p className="font-bold dark:text-white">{formatCurrency(c.amount)}</p>
                      </div>
                    ))}
                    <div className="border-t dark:border-gray-700 pt-3">
                      <p className="font-medium dark:text-white mb-3">Optional Add-ons (select the ones you need)</p>
                      {regData.optionalComponents?.length > 0 ? regData.optionalComponents.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={c.id}
                              checked={selectedOptionals.includes(c.id)}
                              onCheckedChange={() => toggleOptional(c.id)}
                            />
                            <div>
                              <Label htmlFor={c.id} className="font-medium cursor-pointer dark:text-white">{c.name}</Label>
                              <p className="text-xs text-gray-500">{c.description || c.type}</p>
                            </div>
                          </div>
                          <p className="font-bold dark:text-white">{formatCurrency(c.amount)}</p>
                        </div>
                      )) : <p className="text-sm text-gray-500">No optional fees available.</p>}
                    </div>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Mandatory Total:</span><span className="font-bold dark:text-white">{formatCurrency(mandatoryTotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Selected Optionals:</span><span className="font-bold dark:text-white">{formatCurrency(selectedOptionalTotal)}</span></div>
                    <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2">
                      <span>Estimated Total:</span><span className="text-blue-600">{formatCurrency(mandatoryTotal + selectedOptionalTotal)}</span>
                    </div>
                  </div>
                  <Button onClick={submitRegistration} disabled={submitting} className="w-full">{submitting ? 'Submitting...' : 'Confirm Fee Registration'}</Button>
                  <p className="text-xs text-center text-gray-500">Once confirmed, selections are locked. Contact the school to make changes.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* BILL TAB */}
      {activeTab === 'bill' && (
        <div className="space-y-4">
          {!billData?.exists ? (
            <Card className="dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold dark:text-white">Bill Not Yet Generated</h3>
                <p className="text-gray-500 mt-2">{billData?.message || 'Your school bill has not been generated for this term yet. Please check back later or contact the school.'}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="dark:border-gray-700"><CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Total Billed</p>
                  <p className="text-2xl font-bold dark:text-white">{formatCurrency(billData.bill.totalAmount)}</p>
                </CardContent></Card>
                <Card className="dark:border-gray-700"><CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(billData.bill.amountPaid)}</p>
                </CardContent></Card>
                <Card className="dark:border-gray-700"><CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(billData.bill.balance)}</p>
                </CardContent></Card>
              </div>
              {billData.bill.balance > 0 && (
                <div className="flex justify-end gap-2">
                  <Button onClick={() => initiatePayment()} className="bg-green-600 hover:bg-green-700">
                    <CreditCard className="w-4 h-4 mr-2" />Pay Now
                  </Button>
                </div>
              )}
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="dark:text-white">Fee Bill — {billData.academicYear?.name}</CardTitle>
                      <CardDescription className="dark:text-gray-400">{regData?.student?.class} | Status: <Badge className={statusColors[billData.bill.status]}>{billData.bill.status?.replace('_', ' ')}</Badge></CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left p-3 text-sm font-medium dark:text-gray-300">Fee Item</th>
                        <th className="text-right p-3 text-sm font-medium dark:text-gray-300">Amount Due</th>
                        <th className="text-right p-3 text-sm font-medium dark:text-gray-300">Amount Paid</th>
                        <th className="text-right p-3 text-sm font-medium dark:text-gray-300">Outstanding</th>
                        <th className="text-center p-3 text-sm font-medium dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.bill.items?.map((item: any) => (
                        <tr key={item.id} className="border-b dark:border-gray-800">
                          <td className="p-3 dark:text-white">{item.componentName}</td>
                          <td className="p-3 text-right dark:text-white">{formatCurrency(item.amountDue)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(item.amountPaid)}</td>
                          <td className={`p-3 text-right font-bold ${item.outstanding > 0 ? 'text-red-500' : 'text-gray-400'}`}>{formatCurrency(item.outstanding)}</td>
                          <td className="p-3 text-center"><Badge className={statusColorsItem[item.status]}>{item.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {billData.bill.receipts?.length > 0 && (
                    <div className="p-4 border-t dark:border-gray-700">
                      <p className="text-sm font-medium dark:text-white mb-2">Payment History</p>
                      {billData.bill.receipts.map((r: any) => (
                        <div key={r.id} className="flex justify-between items-center text-sm py-1">
                          <span className="text-gray-500">{r.receiptNo} — {new Date(r.generatedAt).toLocaleDateString()}</span>
                          <span className="text-green-600 font-bold">{formatCurrency(r.totalPaid)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={exportBillToExcel}>
                  <Download className="w-4 h-4 mr-2" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportBillToPDF}>
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <Card className="dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Payment History</CardTitle>
            <CardDescription className="dark:text-gray-400">List of all payments made</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length > 0 ? (
              <div className="divide-y dark:divide-gray-700">
                {payments.map(p => (
                  <div key={p.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium dark:text-white">
                          {p.method === 'BANK_TRANSFER' ? 'Bank Transfer' : p.method === 'CASH' ? 'Cash' : p.method === 'CARD' ? 'Card Payment' : p.method}
                        </p>
                        <p className="text-sm text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Date not available'}</p>
                        {p.transactionId && <p className="text-xs text-gray-400 font-mono">Ref: {p.transactionId}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(p.amount)}</p>
                        <Badge className={p.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-700'}>{p.status}</Badge>
                      </div>
                    </div>
                    {billData?.bill?.items && (
                      <div className="mt-3 pt-3 border-t dark:border-gray-700">
                        <p className="text-sm font-medium dark:text-gray-300 mb-2">Components Paid:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {billData.bill.items.filter((item: any) => item.amountPaid > 0).map((item: any) => (
                            <div key={item.id} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="dark:text-white">{item.componentName}</p>
                              <p className="text-green-600">{formatCurrency(item.amountPaid)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No payments recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RECEIPTS TAB */}
      {activeTab === 'receipts' && (
        <Card className="dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="dark:text-white">My Payment Receipts</CardTitle>
            {receipts.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportReceiptsToExcel}>
                  <Download className="w-4 h-4 mr-2" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportReceiptsToPDF}>
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {receipts.length > 0 ? (
              <div className="divide-y dark:divide-gray-700">
                {receipts.map(r => (
                  <div key={r.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold dark:text-white">{r.receiptNo}</p>
                        <p className="text-xs text-gray-500">{r.term?.name} | {new Date(r.generatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-green-600">{formatCurrency(r.totalPaid)}</p>
                        <Button size="sm" variant="outline" onClick={() => downloadReceipt(r.id, r.receiptNo)}>Download</Button>
                      </div>
                    </div>
                    {billData?.bill?.items && (
                      <div className="mt-2 pt-2 border-t dark:border-gray-700">
                        <p className="text-sm font-medium dark:text-gray-300 mb-2">Components Covered:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {billData.bill.items.filter((item: any) => item.amountPaid > 0).map((item: any) => (
                            <div key={item.id} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="dark:text-white">{item.componentName}</p>
                              <p className="text-green-600">{formatCurrency(item.amountPaid)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No payment receipts yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}