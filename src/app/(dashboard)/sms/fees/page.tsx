'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Settings, BookOpen, FileText, DollarSign, Receipt, TrendingUp, Percent,
  CheckCircle, Clock, Users, Loader2, Search, Pencil, Trash2, Download, List
} from 'lucide-react';
import { exportToExcel, exportToPDF, formatCurrency as formatCurrencyUtil, formatDate, formatStatus, formatFeeComponentExport, formatFeeBillExport, formatFeePaymentExport, formatFeeReceiptExport } from '@/lib/export-utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  CONFIRMED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
};

const formatCurrency = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.fieldErrors) return Object.values(error.fieldErrors).flat().join(', ');
  if (error?.formErrors) return Object.values(error.formErrors).flat().join(', ');
  if (error?.message) return error.message;
  return 'An error occurred';
};

export default function FeesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [feeTypeLabels, setFeeTypeLabels] = useState<Record<string, string>>({});

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  const [components, setComponents] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [tierMap, setTierMap] = useState<Map<string, any>>(new Map());
  const [classes, setClasses] = useState<any[]>([]);
  const [billGenTier, setBillGenTier] = useState('');
  const [billGenClass, setBillGenClass] = useState('');
  const [billGenStudent, setBillGenStudent] = useState('');
  const [billGenStudentSearch, setBillGenStudentSearch] = useState('');
  const [billGenStudentResults, setBillGenStudentResults] = useState<any[]>([]);
  const [billGenStudentShowDropdown, setBillGenStudentShowDropdown] = useState(false);

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regSummary, setRegSummary] = useState({ total: 0, confirmed: 0, pending: 0 });

  const [bills, setBills] = useState<any[]>([]);
  const [billSummary, setBillSummary] = useState<any>({});

  const [payments, setPayments] = useState<any[]>([]);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptSummary, setReceiptSummary] = useState({ total: 0, totalCollected: 0 });

  const [balanceReport, setBalanceReport] = useState<any[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<any>({});

  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState<any[]>([]);
  const [siblingDiscount, setSiblingDiscount] = useState<any>(null);

  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountTypeDialog, setShowDiscountTypeDialog] = useState(false);
  const [showApplyDiscountDialog, setShowApplyDiscountDialog] = useState(false);
  const [bulkComponent, setBulkComponent] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [paymentItems, setPaymentItems] = useState<any[]>([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [applyStudents, setApplyStudents] = useState<any[]>([]);

  const [newComponent, setNewComponent] = useState({ name: '', type: 'TUITION', category: 'MANDATORY', amount: '', description: '', tierId: '', termId: '' });
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [showEditComponentDialog, setShowEditComponentDialog] = useState(false);
  const [newDiscountType, setNewDiscountType] = useState({ name: '', code: '', discountPercentage: '', maxDiscountPerStudent: '', appliesTo: 'ALL', requiresApproval: false });
  const [editingDiscountType, setEditingDiscountType] = useState<any>(null);
  const [applyDiscountForm, setApplyDiscountForm] = useState({ studentId: '', studentSearch: '', discountTypeId: '', discountPercentage: '', reason: '' });
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [paymentStudentSearch, setPaymentStudentSearch] = useState('');
  const [paymentStudentResults, setPaymentStudentResults] = useState<any[]>([]);
  const [paymentStudentShowDropdown, setPaymentStudentShowDropdown] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<any>(null);
  const [paymentYear, setPaymentYear] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('');
  const [showRegStudentDialog, setShowRegStudentDialog] = useState(false);
  const [regStudentSearch, setRegStudentSearch] = useState('');
  const [regStudentResults, setRegStudentResults] = useState<any[]>([]);
  const [regStudentShowDropdown, setRegStudentShowDropdown] = useState(false);
  const [regStudent, setRegStudent] = useState<any>(null);
  const [regOptionalComponents, setRegOptionalComponents] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentBill, setPaymentBill] = useState<any>(null);
  const [paymentItemsManual, setPaymentItemsManual] = useState<any[]>([]);

  useEffect(() => { fetchAcademicYears(); fetchTiers(); }, []);

  async function fetchAcademicYears() {
    try {
      const res = await authFetch('/api/sms/academic-years');
      if (res.ok) {
        const data = await res.json();
        const years = data?.years || data || [];
        setAcademicYears(Array.isArray(years) ? years : []);
        const active = years.find((y: any) => y.isActive);
        if (active) { setSelectedYear(active.id); fetchTerms(active.id); }
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

  function onYearChange(v: string) {
    setSelectedYear(v);
    setSelectedTerm('');
    fetchTerms(v);
  }

  async function fetchTiers() {
    try {
      const res = await authFetch('/api/sms/tiers');
      if (res.ok) {
        const data = await res.json();
        const tierList = data?.data || [];
        setTiers(tierList);
        setTierMap(new Map(tierList.map((t: any) => [t.id, t])));
      }
    } catch {}
  }

  async function fetchClasses(tierId?: string) {
    try {
      const params = new URLSearchParams();
      if (tierId) params.set('tierId', tierId);
      if (selectedYear) params.set('academicYearId', selectedYear);
      const res = await authFetch('/api/school/classes?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch {}
  }

  function loadOptionalComponents(studentId: string) {
    if (components.length > 0) {
      setRegOptionalComponents(components.map(c => ({ componentId: c.id, componentName: c.name, amount: c.amount })));
    }
  }

  function openRegStudentDialog() {
    if (!selectedYear) {
      toast({ variant: 'destructive', description: 'Please select an academic year first' });
      return;
    }
    if (components.length === 0) {
      fetchComponents();
    }
    setShowRegStudentDialog(true);
  }

  async function saveStudentRegistration() {
    if (!regStudent || !selectedYear) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: regStudent.id,
          academicYearId: selectedYear,
          termId: selectedTerm || undefined,
          selections: regOptionalComponents.map(c => ({ feeComponentId: c.componentId })),
          status: 'CONFIRMED',
        }),
      });
      const data = await res.json();
      if (data.registration || data.studentFeeRegistration) {
        toast({ description: 'Student registered successfully!' });
        setShowRegStudentDialog(false);
        setRegStudent(null);
        setRegStudentSearch('');
        setRegOptionalComponents([]);
        fetchRegistrations();
      } else {
        toast({ variant: 'destructive', description: getErrorMessage(data.error) || 'Failed to register student' });
      }
    } catch { toast({ variant: 'destructive', description: 'Failed to register student' }); } finally { setLoading(false); }
  }

  async function fetchFeeTypes() {
    try {
      const res = await authFetch('/api/sms/fees/types?isActive=true');
      if (res.ok) {
        const data = await res.json();
        const types = data.feeTypes || [];
        setFeeTypes(types);
        const labels: Record<string, string> = {};
        types.forEach((t: any) => { labels[t.code] = t.name; });
        setFeeTypeLabels(labels);
      }
    } catch {}
  }

  useEffect(() => { 
    fetchAcademicYears(); 
    fetchTiers(); 
    fetchFeeTypes();
    if (selectedYear) fetchClasses(selectedTier || undefined);
  }, []);

  async function fetchComponents() {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: selectedYear });
      if (selectedTerm) params.set('termId', selectedTerm);
      if (selectedTier) params.set('tierId', selectedTier);
      const res = await authFetch('/api/sms/fees/components?' + params.toString());
      if (!res.ok) {
        console.error('Failed to load components:', res.status);
        setComponents([]);
        return;
      }
      const data = await res.json();
      const comps = Array.isArray(data) ? data : (data.components || []);
      if (comps.length > 0) {
        const res2 = await authFetch('/api/sms/tiers');
        if (res2.ok) {
          const tData = await res2.json();
          const tList = Array.isArray(tData) ? tData : (tData.tiers || tData.data || []);
          const tMap = new Map(tList.map((t: any) => [t.id, t]));
          setComponents(comps.map((c: any) => ({ ...c, tier: c.tierId ? tMap.get(c.tierId) : null })));
          return;
        }
      }
      setComponents(comps.map((c: any) => ({ ...c, tier: null })));
    } catch (e) {
      console.error('Error fetching components:', e);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  }

  async function createComponent() {
    setLoading(true);
    try {
      const isBulk = bulkComponent && newComponent.name.includes('\n');
      if (isBulk) {
        const lines = newComponent.name.split('\n').filter(l => l.trim());
        const components = lines.map(line => {
          const [name, type, cat, amt] = line.split('|');
          return {
            name: (name || '').trim(),
            type: (type || 'TUITION').trim().toUpperCase(),
            category: (cat || 'MANDATORY').trim().toUpperCase(),
            amount: parseFloat((amt || '0').trim()) || 0,
          };
        }).filter(c => c.name);
        const payload = {
          bulk: true,
          academicYearId: selectedYear,
          termId: selectedTerm || null,
          components,
        };
        const res = await authFetch('/api/sms/fees/components', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.components) {
          toast({ description: `${data.count || components.length} components created` });
          setShowComponentDialog(false);
          setBulkComponent(false);
          setNewComponent({ name: '', type: 'TUITION', category: 'MANDATORY', amount: '', description: '', tierId: '', termId: '' });
          await fetchComponents();
        } else {
          const errMsg = typeof data.error === 'string' ? data.error : (data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(', ') : 'Failed');
          toast({ variant: 'destructive', description: errMsg });
        }
        setLoading(false);
        return;
      }

      const tierId = newComponent.tierId && newComponent.tierId !== 'all' ? newComponent.tierId : null;
      const termId = newComponent.termId && newComponent.termId !== 'all' ? newComponent.termId : null;
      const payload = {
        name: newComponent.name,
        type: newComponent.type,
        category: newComponent.category,
        amount: newComponent.amount ? parseFloat(newComponent.amount) : 0,
        description: newComponent.description,
        academicYearId: selectedYear,
        termId,
        tierId,
      };
      const res = await authFetch('/api/sms/fees/components', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.component) {
        toast({ description: 'Component created' });
        setShowComponentDialog(false);
        setNewComponent({ name: '', type: 'TUITION', category: 'MANDATORY', amount: '', description: '', tierId: '', termId: '' });
        await fetchComponents();
      } else {
        const errMsg = typeof data.error === 'string' ? data.error : (data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(', ') : 'Failed');
        toast({ variant: 'destructive', description: errMsg });
      }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  function openEditComponentDialog(component: any) {
    setEditingComponent({ ...component, amount: component.amount?.toString() || '' });
    setShowEditComponentDialog(true);
  }

  async function updateComponent() {
    if (!editingComponent) return;
    setLoading(true);
    try {
      const payload = {
        ...editingComponent,
        amount: editingComponent.amount ? parseFloat(editingComponent.amount) : 0,
      };
      const res = await authFetch(`/api/sms/fees/components/${editingComponent.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.component) { toast({ description: 'Component updated' }); setShowEditComponentDialog(false); fetchComponents(); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function deleteComponent(id: string) {
    if (!confirm('Are you sure you want to delete this component?')) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/sms/fees/components/${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ description: 'Component deleted' }); fetchComponents(); }
      else { const data = await res.json(); toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function fetchRegistrations() {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: selectedYear });
      if (selectedTerm) params.set('termId', selectedTerm);
      if (selectedTier) params.set('tierId', selectedTier);
      const res = await authFetch('/api/sms/fees/registration?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setRegSummary(data.summary || { total: 0, confirmed: 0, pending: 0 });
      }
    } catch {} finally { setLoading(false); }
  }

  async function fetchBills() {
    if (!selectedYear || !selectedTerm) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: selectedYear, termId: selectedTerm });
      if (selectedTier) params.set('tierId', selectedTier);
      const res = await authFetch('/api/sms/fees/bills/generate?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
        setBillSummary(data.summary || {});
      }
    } catch {} finally { setLoading(false); }
  }

  async function generateBills(force = false) {
    setLoading(true);
    try {
      const payload: any = { academicYearId: selectedYear, termId: selectedTerm, force };
      if (billGenTier) payload.tierId = billGenTier;
      if (billGenClass) payload.classId = billGenClass;
      if (billGenStudent) payload.studentId = billGenStudent;
      const res = await authFetch('/api/sms/fees/bills/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.results) {
        toast({ description: `Generated: ${data.results.generated}, Skipped: ${data.results.skipped}, Errors: ${data.results.errors.length}` });
        fetchBills();
      } else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  function openPaymentDialog(bill: any) {
    setSelectedBill(bill);
    setStudentSearch(`${bill.student?.firstName} ${bill.student?.lastName} (${bill.student?.studentId})`);
    const items = (bill.billItems || []).map((item: any) => ({ ...item, paymentAmount: '' }));
    setPaymentItems(items);
    setTotalPayment(0);
    setShowPaymentDialog(true);
  }

  function updateItemPayment(idx: number, value: string) {
    const items = [...paymentItems];
    items[idx].paymentAmount = value;
    setPaymentItems(items);
    setTotalPayment(items.reduce((sum: number, i: any) => sum + (parseFloat(i.paymentAmount) || 0), 0));
  }

  async function recordPayment() {
    setLoading(true);
    try {
      const items = paymentItems
        .filter((i: any) => parseFloat(i.paymentAmount) > 0)
        .map((i: any) => ({ billItemId: i.id, amount: parseFloat(i.paymentAmount) }));
      if (items.length === 0) { toast({ variant: 'destructive', description: 'Enter payment amount for at least one item' }); setLoading(false); return; }
      const res = await authFetch('/api/sms/fees/payments/bill-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: selectedBill.id, items, method: 'CASH' }),
      });
      const data = await res.json();
      if (data.paymentId) {
        toast({ description: 'Payment recorded! Generating receipt...' });
        setShowPaymentDialog(false);
        const pdfRes = await authFetch('/api/sms/fees/receipts/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptId: data.receipt?.id }),
        });
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${data.receipt?.receiptNo || 'receipt'}.pdf`; a.click();
          URL.revokeObjectURL(url);
        }
        fetchBills();
        fetchReceipts();
      } else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function fetchPayments() {
    if (!selectedYear || !selectedTerm) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/payments/bill-payment?' + new URLSearchParams({ academicYearId: selectedYear, termId: selectedTerm }));
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function fetchStudentBillItems() {
    if (!paymentStudent || !paymentYear || !paymentTerm) return;
    setPaymentItemsManual([]);
    try {
      const params = new URLSearchParams({ studentId: paymentStudent.id, academicYearId: paymentYear, termId: paymentTerm });
      const res = await authFetch('/api/sms/fees/bills?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        const bills = data.bills || [];
        if (bills.length > 0) {
          const bill = bills[0];
          setPaymentBill(bill);
          const items = (bill.billItems || []).filter((item: any) => item.outstanding > 0).map((item: any) => ({
            ...item,
            allocate: true,
            allocationAmount: '',
          }));
          setPaymentItemsManual(items);
        } else {
          setPaymentBill(null);
          fetchFeeComponentsForPayment();
        }
      }
    } catch { fetchFeeComponentsForPayment(); }
  }

async function fetchFeeComponentsForPayment() {
    if (!paymentStudent || !paymentYear || !paymentTerm) return;
    try {
      const params = new URLSearchParams({ academicYearId: paymentYear, termId: paymentTerm });
      const res = await authFetch(`/api/sms/fees/components?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const allComponents = Array.isArray(data) ? data : (data.components || []);
        if (allComponents.length === 0) {
          setPaymentItemsManual([]);
          return;
        }
        const items = allComponents.map((c: any) => ({
          id: c.id,
          componentName: c.name,
          componentType: c.type,
          amountDue: c.amount,
          outstanding: c.amount,
          allocate: true,
          allocationAmount: c.amount.toString(),
          isComponentOnly: true,
        }));
        setPaymentItemsManual(items);
      } else {
        setPaymentItemsManual([]);
      }
    } catch { 
      setPaymentItemsManual([]);
    }
  }

  useEffect(() => {
    if (paymentStudent && selectedYear) {
      fetchStudentBillItems();
    } else {
      setPaymentBill(null);
      setPaymentItemsManual([]);
    }
  }, [paymentStudent, paymentYear, paymentTerm]);

  async function recordManualPayment() {
    if (!paymentStudent || !paymentAmount || parseFloat(paymentAmount) <= 0 || !paymentYear || !paymentTerm) return;
    setLoading(true);
    try {
      const items = paymentItemsManual
        .filter((i: any) => i.allocate && parseFloat(i.allocationAmount || '0') > 0)
        .map((i: any) => ({
          billItemId: i.billItemId || (i.isComponentOnly ? undefined : i.id),
          componentId: i.isComponentOnly ? i.id : undefined,
          amount: parseFloat(i.allocationAmount)
        }));
      const res = await authFetch('/api/sms/fees/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: paymentStudent.id,
          billId: paymentBill?.id || undefined,
          academicYearId: paymentYear,
          termId: paymentTerm,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          paidAt: paymentDate,
          reference: paymentReference,
          items: items.length > 0 ? items : undefined,
        }),
      });
      const data = await res.json();
      if (data.paymentId || data.success) {
        toast({ description: 'Payment recorded successfully!' });
        setShowAddPaymentDialog(false);
        resetPaymentForm();
        fetchPayments();
        fetchBills();
        fetchReceipts();
      } else {
        toast({ variant: 'destructive', description: getErrorMessage(data.error) || 'Failed to record payment' });
      }
    } catch { toast({ variant: 'destructive', description: 'Failed to record payment' }); } finally { setLoading(false); }
  }

  function resetPaymentForm() {
    setPaymentStudentSearch('');
    setPaymentStudentResults([]);
    setPaymentStudentShowDropdown(false);
    setPaymentStudent(null);
    setPaymentYear('');
    setPaymentTerm('');
    setPaymentAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference('');
    setPaymentBill(null);
    setPaymentItemsManual([]);
  }

  async function fetchReceipts() {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: selectedYear });
      if (selectedTerm) params.set('termId', selectedTerm);
      const res = await authFetch('/api/sms/fees/receipts?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts || []);
        setReceiptSummary(data.summary || { total: 0, totalCollected: 0 });
      }
    } catch {} finally { setLoading(false); }
  }

  async function fetchBalanceReport() {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: selectedYear });
      if (selectedTerm) params.set('termId', selectedTerm);
      if (selectedTier) params.set('tierId', selectedTier);
      const res = await authFetch('/api/sms/fees/reports/balance-summary?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setBalanceReport(data.balanceReport || []);
        setBalanceSummary(data.summary || {});
      }
    } catch {} finally { setLoading(false); }
  }

  async function fetchDiscountTypes() {
    try {
      const res = await authFetch('/api/sms/fees/discount-types');
      if (res.ok) {
        const data = await res.json();
        setDiscountTypes(Array.isArray(data) ? data : (data.discountTypes || []));
      }
    } catch {}
  }

  async function fetchStudentDiscounts() {
    if (!selectedYear) return;
    const params = new URLSearchParams({ academicYearId: selectedYear });
    try {
      const res = await authFetch('/api/sms/fees/discounts?' + params);
      if (res.ok) {
        const data = await res.json();
        setStudentDiscounts(data.discounts || []);
      }
    } catch {}
  }

  async function fetchSiblingDiscount() {
    if (!selectedYear) return;
    try {
      const res = await authFetch('/api/sms/fees/sibling-discount?academicYearId=' + selectedYear);
      if (res.ok) {
        const data = await res.json();
        const discounts = data.siblingDiscounts || [];
        const forYear = discounts.find((s: any) => s.academicYearId === selectedYear);
        if (forYear) setSiblingDiscount(forYear);
        else setSiblingDiscount(null);
      }
    } catch {}
  }

  function exportComponentsToExcel() {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'tier', label: 'Tier' },
      { key: 'amount', label: 'Amount' },
    ];
    const data = components.map(c => ({
      name: c.name,
      type: feeTypeLabels[c.type] || c.type,
      category: c.category,
      tier: c.tier?.name || 'All Tiers',
      amount: formatCurrency(c.amount),
    }));
    exportToExcel(data, columns, 'Fee_Components');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportComponentsToPDF() {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'tier', label: 'Tier' },
      { key: 'amount', label: 'Amount' },
    ];
    const data = components.map(c => ({
      name: c.name,
      type: feeTypeLabels[c.type] || c.type,
      category: c.category,
      tier: c.tier?.name || 'All Tiers',
      amount: formatCurrency(c.amount),
    }));
    exportToPDF(data, columns, 'Fee_Components', { 
      title: 'Fee Components Report',
      subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}`
    });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportBillsToExcel() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'class', label: 'Class' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
    ];
    const data = bills.map(b => ({
      student: `${b.student?.firstName || ''} ${b.student?.lastName || ''}`.trim(),
      studentId: b.student?.studentId || '-',
      class: b.student?.enrollments?.[0]?.academicClass?.name || '-',
      totalAmount: formatCurrency(b.totalAmount),
      amountPaid: formatCurrency(b.amountPaid),
      balance: formatCurrency(b.balance),
      status: formatStatus(b.status),
    }));
    exportToExcel(data, columns, 'Fee_Bills');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportBillsToPDF() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'class', label: 'Class' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
    ];
    const data = bills.map(b => ({
      student: `${b.student?.firstName || ''} ${b.student?.lastName || ''}`.trim(),
      studentId: b.student?.studentId || '-',
      class: b.student?.enrollments?.[0]?.academicClass?.name || '-',
      totalAmount: formatCurrency(b.totalAmount),
      amountPaid: formatCurrency(b.amountPaid),
      balance: formatCurrency(b.balance),
      status: formatStatus(b.status),
    }));
    exportToPDF(data, columns, 'Fee_Bills', {
      title: 'Fee Bills Report',
      subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}, Term: ${terms.find(t => t.id === selectedTerm)?.name || 'All'}`
    });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportPaymentsToExcel() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'paidAt', label: 'Payment Date' },
      { key: 'transactionId', label: 'Transaction ID' },
    ];
    const data = payments.map(p => ({
      student: `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.trim(),
      studentId: p.student?.studentId || '-',
      amount: formatCurrency(p.amount),
      method: formatStatus(p.method),
      status: formatStatus(p.status),
      paidAt: formatDate(p.paidAt),
      transactionId: p.transactionId || p.referenceNo || '-',
    }));
    exportToExcel(data, columns, 'Fee_Payments');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportPaymentsToPDF() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'paidAt', label: 'Payment Date' },
      { key: 'transactionId', label: 'Transaction ID' },
    ];
    const data = payments.map(p => ({
      student: `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.trim(),
      studentId: p.student?.studentId || '-',
      amount: formatCurrency(p.amount),
      method: formatStatus(p.method),
      status: formatStatus(p.status),
      paidAt: formatDate(p.paidAt),
      transactionId: p.transactionId || p.referenceNo || '-',
    }));
    exportToPDF(data, columns, 'Fee_Payments', {
      title: 'Fee Payments Report',
      subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}, Term: ${terms.find(t => t.id === selectedTerm)?.name || 'All'}`
    });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportReceiptsToExcel() {
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'totalPaid', label: 'Total Paid' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = receipts.map(r => ({
      receiptNo: r.receiptNo,
      student: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
      studentId: r.student?.studentId || '-',
      totalPaid: formatCurrency(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToExcel(data, columns, 'Fee_Receipts');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportReceiptsToPDF() {
    const columns = [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'totalPaid', label: 'Total Paid' },
      { key: 'generatedAt', label: 'Date' },
    ];
    const data = receipts.map(r => ({
      receiptNo: r.receiptNo,
      student: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
      studentId: r.student?.studentId || '-',
      totalPaid: formatCurrency(r.totalPaid),
      generatedAt: formatDate(r.generatedAt),
    }));
    exportToPDF(data, columns, 'Fee_Receipts', {
      title: 'Fee Receipts Report',
      subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}, Term: ${terms.find(t => t.id === selectedTerm)?.name || 'All'}`
    });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportRegistrationsToExcel() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'status', label: 'Status' },
      { key: 'selections', label: 'Optional Selections' },
    ];
    const data = registrations.map(r => ({
      student: `${r.student?.lastName} ${r.student?.firstName}`,
      studentId: r.student?.studentId,
      status: r.status,
      selections: r.selections?.map((s: any) => s.component?.name).join(', ') || '-',
    }));
    exportToExcel(data, columns, 'Fee_Registrations');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportRegistrationsToPDF() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'status', label: 'Status' },
      { key: 'selections', label: 'Optional Selections' },
    ];
    const data = registrations.map(r => ({
      student: `${r.student?.lastName} ${r.student?.firstName}`,
      studentId: r.student?.studentId,
      status: r.status,
      selections: r.selections?.map((s: any) => s.component?.name).join(', ') || '-',
    }));
    exportToPDF(data, columns, 'Fee_Registrations', { title: 'Fee Registration Report', subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}` });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportReportsToExcel() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'term', label: 'Term' },
      { key: 'status', label: 'Status' },
      { key: 'billed', label: 'Billed' },
      { key: 'paid', label: 'Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ];
    const data = balanceReport.map(r => ({
      student: r.studentName,
      term: r.termName,
      status: r.status?.replace('_', ' '),
      billed: formatCurrency(r.totalAmount),
      paid: formatCurrency(r.amountPaid),
      outstanding: formatCurrency(r.balance),
    }));
    exportToExcel(data, columns, 'Fee_Balance_Report');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportReportsToPDF() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'term', label: 'Term' },
      { key: 'status', label: 'Status' },
      { key: 'billed', label: 'Billed' },
      { key: 'paid', label: 'Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ];
    const data = balanceReport.map(r => ({
      student: r.studentName,
      term: r.termName,
      status: r.status?.replace('_', ' '),
      billed: formatCurrency(r.totalAmount),
      paid: formatCurrency(r.amountPaid),
      outstanding: formatCurrency(r.balance),
    }));
    exportToPDF(data, columns, 'Fee_Balance_Report', { 
      title: 'Fee Balance Report',
      subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'} | Total: ${formatCurrency(balanceSummary.totalOutstanding)} Outstanding`,
      orientation: 'landscape'
    });
    toast({ description: 'Exported to PDF successfully' });
  }

  function exportDiscountsToExcel() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'discountType', label: 'Discount Type' },
      { key: 'code', label: 'Code' },
      { key: 'percentage', label: 'Percentage' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ];
    const data = studentDiscounts.map(d => ({
      student: `${d.student?.lastName} ${d.student?.firstName}`,
      discountType: d.discountType?.name,
      code: d.discountType?.code,
      percentage: `${d.discountPercentage}%`,
      status: d.isActive ? 'Active' : 'Inactive',
      reason: d.reason || '-',
    }));
    exportToExcel(data, columns, 'Student_Discounts');
    toast({ description: 'Exported to Excel successfully' });
  }

  function exportDiscountsToPDF() {
    const columns = [
      { key: 'student', label: 'Student' },
      { key: 'discountType', label: 'Discount Type' },
      { key: 'code', label: 'Code' },
      { key: 'percentage', label: 'Percentage' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ];
    const data = studentDiscounts.map(d => ({
      student: `${d.student?.lastName} ${d.student?.firstName}`,
      discountType: d.discountType?.name,
      code: d.discountType?.code,
      percentage: `${d.discountPercentage}%`,
      status: d.isActive ? 'Active' : 'Inactive',
      reason: d.reason || '-',
    }));
    exportToPDF(data, columns, 'Student_Discounts', { title: 'Student Discounts Report', subtitle: `Academic Year: ${academicYears.find(y => y.id === selectedYear)?.name || 'All'}` });
    toast({ description: 'Exported to PDF successfully' });
  }

  async function createDiscountType() {
    setLoading(true);
    try {
      const payload = {
        name: newDiscountType.name,
        code: newDiscountType.code,
        discountPercentage: parseFloat(newDiscountType.discountPercentage) || 0,
        maxDiscountPerStudent: parseFloat(newDiscountType.maxDiscountPerStudent) || 0,
        appliesTo: newDiscountType.appliesTo,
        requiresApproval: newDiscountType.requiresApproval,
        tenantId: user?.tenantId,
        academicYearId: selectedYear,
      };
      const res = await authFetch('/api/sms/fees/discount-types', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.discountType) { toast({ description: 'Discount type created' }); setShowDiscountTypeDialog(false); fetchDiscountTypes(); setNewDiscountType({ name: '', code: '', discountPercentage: '', maxDiscountPerStudent: '', appliesTo: 'ALL', requiresApproval: false }); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function updateDiscountType(id: string) {
    setLoading(true);
    try {
      const payload = {
        id,
        name: editingDiscountType.name,
        code: editingDiscountType.code,
        discountPercentage: parseFloat(editingDiscountType.discountPercentage) || 0,
        maxDiscountPerStudent: parseFloat(editingDiscountType.maxDiscountPerStudent) || 0,
        appliesTo: editingDiscountType.appliesTo,
        requiresApproval: editingDiscountType.requiresApproval,
        isActive: editingDiscountType.isActive,
        tenantId: user?.tenantId,
      };
      const res = await authFetch('/api/sms/fees/discount-types', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.discountType) { toast({ description: 'Discount type updated' }); setShowDiscountTypeDialog(false); setEditingDiscountType(null); fetchDiscountTypes(); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function deleteDiscountType(id: string) {
    if (!confirm('Are you sure you want to delete this discount type?')) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/discount-types?id=' + id, { method: 'DELETE' });
      if (res.ok) { toast({ description: 'Discount type deleted' }); fetchDiscountTypes(); }
      else { const data = await res.json(); toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function applyDiscount() {
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', studentId: applyDiscountForm.studentId, discountTypeId: applyDiscountForm.discountTypeId, discountPercentage: applyDiscountForm.discountPercentage || undefined, academicYearId: selectedYear, reason: applyDiscountForm.reason }),
      });
      const data = await res.json();
      if (data.studentDiscount) { toast({ description: 'Discount applied' }); setShowApplyDiscountDialog(false); setApplyDiscountForm({ studentId: '', studentSearch: '', discountTypeId: '', discountPercentage: '', reason: '' }); fetchStudentDiscounts(); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  async function fetchStudents(query: string) {
    if (query.length < 2) { setApplyStudents([]); return; }
    try {
      const res = await authFetch('/api/sms/students?search=' + encodeURIComponent(query));
      if (res.ok) {
        const data = await res.json();
        setApplyStudents(Array.isArray(data) ? data : (data.students || []));
      }
    } catch { setApplyStudents([]); }
  }

  async function saveSiblingDiscount(field: string, value: any) {
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/sibling-discount', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId: selectedYear, [field]: value }),
      });
      const data = await res.json();
      if (data.siblingDiscount) { toast({ description: 'Sibling discount updated' }); fetchSiblingDiscount(); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed to update sibling discount' }); } finally { setLoading(false); }
  }

  async function approveRejectDiscount(id: string, action: 'approve' | 'reject') {
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve-reject', studentDiscountId: id, approvalAction: action }),
      });
      const data = await res.json();
      if (data.studentDiscount) { toast({ description: data.message }); fetchStudentDiscounts(); }
      else { toast({ variant: 'destructive', description: getErrorMessage(data.error) }); }
    } catch { toast({ variant: 'destructive', description: 'Failed' }); } finally { setLoading(false); }
  }

  function openSiblingDiscountDialog() {
    setSiblingDiscountForm({
      secondChildDiscount: siblingDiscount?.secondChildDiscount?.toString() || '',
      thirdChildDiscount: siblingDiscount?.thirdChildDiscount?.toString() || '',
      fourthChildDiscount: siblingDiscount?.fourthChildDiscount?.toString() || '',
      fifthChildDiscount: siblingDiscount?.fifthChildDiscount?.toString() || '',
      maxDiscountPerChild: siblingDiscount?.maxDiscountPerChild?.toString() || '',
      applyTo: siblingDiscount?.applyTo || 'ALL',
      isEnabled: siblingDiscount?.isEnabled ?? false,
    });
    setShowSiblingDiscountDialog(true);
  }

function loadTabData(tab: string) {
    if (tab === 'components') fetchComponents();
    else if (tab === 'registration') fetchRegistrations();
    else if (tab === 'bills') fetchBills();
    else if (tab === 'payments') fetchPayments();
    else if (tab === 'receipts') fetchReceipts();
    else if (tab === 'reports') fetchBalanceReport();
    else if (tab === 'discounts') { fetchDiscountTypes(); fetchStudentDiscounts(); fetchSiblingDiscount(); }
  }

  useEffect(() => {
    if (activeTab === 'components' && selectedYear) fetchComponents();
  }, [selectedYear, selectedTerm, selectedTier, activeTab]);

  useEffect(() => {
    if (activeTab) loadTabData(activeTab);
  }, [selectedYear, selectedTerm, selectedTier, activeTab]);

  return (
    <div className="space-y-6">
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Fee Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage fees, bills, payments, and receipts</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/sms/fees/types'}>
          <List className="w-4 h-4 mr-2" />Manage Fee Types
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Academic Year" /></SelectTrigger>
          <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Term" /></SelectTrigger>
          <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedTier} onValueChange={v => setSelectedTier(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Tiers" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Tiers</SelectItem>{tiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="components"><Settings className="w-4 h-4 mr-1" />Components</TabsTrigger>
          <TabsTrigger value="registration"><BookOpen className="w-4 h-4 mr-1" />Registration</TabsTrigger>
          <TabsTrigger value="bills"><FileText className="w-4 h-4 mr-1" />Bills</TabsTrigger>
          <TabsTrigger value="payments"><DollarSign className="w-4 h-4 mr-1" />Payments</TabsTrigger>
          <TabsTrigger value="receipts"><Receipt className="w-4 h-4 mr-1" />Receipts</TabsTrigger>
          <TabsTrigger value="reports"><TrendingUp className="w-4 h-4 mr-1" />Reports</TabsTrigger>
          <TabsTrigger value="discounts"><Percent className="w-4 h-4 mr-1" />Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{components.length} component{components.length !== 1 ? 's' : ''}</p>
            <Dialog open={showComponentDialog} onOpenChange={setShowComponentDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Component</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Fee Component</DialogTitle>
                  <DialogDescription>Define a fee item (e.g. Tuition, Transport) for this tier/term</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="bulk" checked={bulkComponent} onChange={e => setBulkComponent(e.target.checked)} className="rounded" />
                    <label htmlFor="bulk" className="text-sm">Bulk create multiple components</label>
                  </div>
                  {bulkComponent ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">Enter components as: name|type|category|amount (one per line)</p>
                      <textarea
                        className="w-full h-40 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm font-mono"
                        placeholder={"Tuition Fee|TUITION|MANDATORY|50000\nTransport|TRANSPORT|OPTIONAL|15000"}
                        onChange={e => {
                          const lines = e.target.value.split('\n').filter(l => l.trim());
                          if (lines.length > 0) {
                            const [name, type, cat, amt] = lines[0].split('|');
                            setNewComponent(prev => ({ ...prev, name: name || '', type: type || 'TUITION', category: cat || 'MANDATORY', amount: amt || '' }));
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <Input placeholder="Component name" value={newComponent.name} onChange={e => setNewComponent(p => ({ ...p, name: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={newComponent.type} onValueChange={v => setNewComponent(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{feeTypes.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newComponent.category} onValueChange={v => setNewComponent(p => ({ ...p, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="MANDATORY">Mandatory</SelectItem><SelectItem value="OPTIONAL">Optional</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <Input type="number" placeholder="Amount (NGN)" value={newComponent.amount} onChange={e => setNewComponent(p => ({ ...p, amount: e.target.value }))} />
                      <Input placeholder="Description (optional)" value={newComponent.description} onChange={e => setNewComponent(p => ({ ...p, description: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={newComponent.tierId || 'all'} onValueChange={v => setNewComponent(p => ({ ...p, tierId: v === 'all' ? '' : v }))}>
                          <SelectTrigger><SelectValue placeholder="Tier (optional)" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Tiers</SelectItem>{tiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newComponent.termId || 'all'} onValueChange={v => setNewComponent(p => ({ ...p, termId: v === 'all' ? '' : v }))}>
                          <SelectTrigger><SelectValue placeholder="Term (optional)" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Terms</SelectItem>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <Button onClick={createComponent} disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create Component'}</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditComponentDialog} onOpenChange={setShowEditComponentDialog}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Fee Component</DialogTitle>
                  <DialogDescription>Update the fee component details</DialogDescription>
                </DialogHeader>
                {editingComponent && (
                  <div className="space-y-4">
                    <Input placeholder="Component name" value={editingComponent.name} onChange={e => setEditingComponent(p => ({ ...p, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={editingComponent.type} onValueChange={v => setEditingComponent(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{feeTypes.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={editingComponent.category} onValueChange={v => setEditingComponent(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="MANDATORY">Mandatory</SelectItem><SelectItem value="OPTIONAL">Optional</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Input type="number" placeholder="Amount (NGN)" value={editingComponent.amount} onChange={e => setEditingComponent(p => ({ ...p, amount: e.target.value }))} />
                    <Input placeholder="Description (optional)" value={editingComponent.description} onChange={e => setEditingComponent(p => ({ ...p, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={editingComponent.tierId || 'all'} onValueChange={v => setEditingComponent(p => ({ ...p, tierId: v === 'all' ? '' : v }))}>
                        <SelectTrigger><SelectValue placeholder="Tier (optional)" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Tiers</SelectItem>{tiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={editingComponent.termId || 'all'} onValueChange={v => setEditingComponent(p => ({ ...p, termId: v === 'all' ? '' : v }))}>
                        <SelectTrigger><SelectValue placeholder="Term (optional)" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Terms</SelectItem>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={updateComponent} disabled={loading} className="w-full">{loading ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <Card className="dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Name</TableHead>
                  <TableHead className="dark:text-gray-300">Type</TableHead>
                  <TableHead className="dark:text-gray-300">Category</TableHead>
                  <TableHead className="dark:text-gray-300">Tier</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {components.map(c => (
                    <TableRow key={c.id} className="dark:border-gray-700">
                      <TableCell className="font-medium dark:text-white">{c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="dark:border-gray-600">{feeTypeLabels[c.type] || c.type}</Badge></TableCell>
                      <TableCell><Badge className={c.category === 'MANDATORY' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'}>{c.category}</Badge></TableCell>
                      <TableCell className="dark:text-gray-300">{c.tier?.name || 'All Tiers'}</TableCell>
                      <TableCell className="text-right font-medium dark:text-white">{formatCurrency(c.amount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7" onClick={() => openEditComponentDialog(c)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-500" onClick={() => deleteComponent(c.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {components.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No fee components yet. Add your first component above.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => exportComponentsToExcel()}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportComponentsToPDF()}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <div className="flex items-center gap-4"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><BookOpen className="w-6 h-6 text-blue-600" /></div>
                <div><p className="text-2xl font-bold dark:text-white">{regSummary.total}</p><p className="text-sm text-gray-500">Total Students</p></div></div>
              </CardContent></Card>
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <div className="flex items-center gap-4"><div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                <div><p className="text-2xl font-bold dark:text-white">{regSummary.confirmed}</p><p className="text-sm text-gray-500">Confirmed</p></div></div>
              </CardContent></Card>
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <div className="flex items-center gap-4"><div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
                <div><p className="text-2xl font-bold dark:text-white">{regSummary.pending}</p><p className="text-sm text-gray-500">Pending Selection</p></div></div>
              </CardContent></Card>
            </div>
            <Button onClick={openRegStudentDialog}>
              <Plus className="w-4 h-4 mr-2" />Register Student
            </Button>
          </div>
          <Card className="dark:border-gray-700">
            <CardHeader><CardTitle className="dark:text-white">Fee Registration Status</CardTitle><CardDescription className="dark:text-gray-400">Students who have confirmed their optional fee selections</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Optional Selections</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {registrations.map(r => (
                    <TableRow key={r.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{r.student?.firstName} {r.student?.lastName} <span className="text-gray-500 text-xs">({r.student?.studentId})</span></TableCell>
                      <TableCell><Badge className={statusColors[r.status] || ''}>{r.status}</Badge></TableCell>
                      <TableCell className="dark:text-gray-300 text-sm">{r.selections?.map((s: any) => s.component?.name).join(', ') || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {registrations.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">No registrations yet. Students must register via the student portal.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => exportRegistrationsToExcel()}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportRegistrationsToPDF()}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Select value={billGenTier} onValueChange={v => { setBillGenTier(v === 'all' ? '' : v); setBillGenClass(''); if (v !== 'all') fetchClasses(v); else fetchClasses(); }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All Tiers" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Tiers</SelectItem>{tiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={billGenClass} onValueChange={v => setBillGenClass(v === 'all' ? '' : v)} disabled={!billGenTier && classes.length === 0}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="relative">
                  <Input 
                    className="w-44"
                    placeholder="Student name..." 
                    value={billGenStudentSearch}
                    onFocus={() => billGenStudentResults.length > 0 && setBillGenStudentShowDropdown(true)}
                    onBlur={() => setTimeout(() => setBillGenStudentShowDropdown(false), 200)}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setBillGenStudentSearch(val);
                      if (val.length >= 2) {
                        try {
                          const res = await authFetch(`/api/sms/students?search=${encodeURIComponent(val)}&limit=5`);
                          if (res.ok) {
                            const data = await res.json();
                            setBillGenStudentResults(data.students || []);
                            setBillGenStudentShowDropdown(true);
                          }
                        } catch {}
                      } else {
                        setBillGenStudentResults([]);
                        setBillGenStudentShowDropdown(false);
                      }
                    }}
                  />
                  {billGenStudentShowDropdown && billGenStudentResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {billGenStudentResults.map((s: any) => (
                        <div 
                          key={s.id}
                          className="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white text-sm"
                          onClick={() => {
                            setBillGenStudent(s.id);
                            setBillGenStudentSearch(`${s.firstName} ${s.lastName}`);
                            setBillGenStudentShowDropdown(false);
                            setBillGenStudentResults([]);
                          }}
                        >
                          {s.firstName} {s.lastName} <span className="text-gray-500 text-xs">({s.studentId})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {billGenStudent && (
                    <button 
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs"
                      onClick={() => { setBillGenStudent(''); setBillGenStudentSearch(''); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <Button onClick={() => generateBills(false)} disabled={loading || !selectedTerm}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Generate Bills
              </Button>
              <Button variant="outline" onClick={() => generateBills(true)} disabled={loading || !selectedTerm}>
                Regenerate All
              </Button>
            </div>
            {billSummary.total > 0 && (
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Paid: {billSummary.fullyPaid}</span>
                <span className="text-yellow-600">Partial: {billSummary.partiallyPaid}</span>
                <span className="text-red-600">Unpaid: {billSummary.unpaid}</span>
                <span>Total: {formatCurrency(billSummary.totalBilled)}</span>
              </div>
            )}
          </div>
          <Card className="dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Paid</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Balance</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {bills.map(b => (
                    <TableRow key={b.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{b.student?.firstName} {b.student?.lastName} <span className="text-gray-500 text-xs">({b.student?.studentId})</span></TableCell>
                      <TableCell className="text-right dark:text-white">{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(b.amountPaid)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(b.balance)}</TableCell>
                      <TableCell><Badge className={b.status === 'FULLY_PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800' : b.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800' : 'bg-red-100 dark:bg-red-900/30 text-red-800'}>{b.status?.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openPaymentDialog(b)} disabled={b.status === 'FULLY_PAID'}>
                          Record Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bills.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No bills generated yet. Click "Generate Bills" to create bills for all registered students.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={exportBillsToExcel}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportBillsToPDF}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={() => setShowAddPaymentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />Add Payment
              </Button>
            </div>
          </div>
          <Card className="dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                  <TableHead className="dark:text-gray-300">Method</TableHead>
                  <TableHead className="dark:text-gray-300">Reference</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{p.student?.firstName} {p.student?.lastName}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="dark:text-gray-300">{p.method}</TableCell>
                      <TableCell className="dark:text-gray-300 text-sm font-mono">{p.reference || '-'}</TableCell>
                      <TableCell className="dark:text-gray-300">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No payments recorded yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={exportPaymentsToExcel}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPaymentsToPDF}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''} | Total: {formatCurrency(receiptSummary.totalCollected)}</p>
          </div>
          <Card className="dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Receipt No</TableHead>
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="dark:text-gray-300">Term</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {receipts.map(r => (
                    <TableRow key={r.id} className="dark:border-gray-700">
                      <TableCell className="font-mono text-sm dark:text-white">{r.receiptNo}</TableCell>
                      <TableCell className="dark:text-white">{r.student?.firstName} {r.student?.lastName}</TableCell>
                      <TableCell className="dark:text-gray-300">{r.term?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(r.totalPaid)}</TableCell>
                      <TableCell className="dark:text-gray-300">{new Date(r.generatedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {receipts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No receipts yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={exportReceiptsToExcel}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportReceiptsToPDF}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {balanceSummary.totalStudents > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold dark:text-white">{balanceSummary.totalStudents}</p>
              </CardContent></Card>
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Fully Paid</p>
                <p className="text-2xl font-bold text-green-600">{balanceSummary.fullyPaid}</p>
              </CardContent></Card>
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(balanceSummary.totalOutstanding)}</p>
              </CardContent></Card>
              <Card className="dark:border-gray-700"><CardContent className="pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(balanceSummary.totalCollected)}</p>
              </CardContent></Card>
            </div>
          )}
          <Card className="dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="dark:text-gray-300">Term</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Billed</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Paid</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Outstanding</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {balanceReport.map(r => (
                    <TableRow key={r.billId} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{r.studentName}</TableCell>
                      <TableCell className="dark:text-gray-300">{r.termName}</TableCell>
                      <TableCell><Badge className={r.status === 'FULLY_PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800' : r.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800' : 'bg-red-100 dark:bg-red-900/30 text-red-800'}>{r.status?.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-right dark:text-white">{formatCurrency(r.totalAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(r.amountPaid)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(r.balance)}</TableCell>
                    </TableRow>
                  ))}
                  {balanceReport.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Select academic year to view report.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => exportReportsToExcel()}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReportsToPDF()}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Percent className="w-6 h-6 text-purple-600" /></div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{discountTypes.filter(d => d.isActive).length}</p>
                    <p className="text-sm text-gray-500">Active Discount Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{studentDiscounts.filter(d => d.status === 'APPROVED').length}</p>
                    <p className="text-sm text-gray-500">Approved Student Discounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{studentDiscounts.filter(d => d.status === 'PENDING_APPROVAL').length}</p>
                    <p className="text-sm text-gray-500">Pending Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Sibling Discount Settings</CardTitle>
                <CardDescription className="dark:text-gray-400">Enable and configure sibling discount rates</CardDescription>
              </div>
              {siblingDiscount && (
                <div className="flex items-center gap-3">
                  <span className="text-sm dark:text-gray-300">Enable Sibling Discount:</span>
                  <Switch checked={siblingDiscount.isEnabled} onCheckedChange={v => saveSiblingDiscount('isEnabled', v)} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!siblingDiscount ? (
                <div className="text-center py-4">
                  <Button size="sm" onClick={() => saveSiblingDiscount('isEnabled', false)} disabled={loading}>
                      {loading ? 'Initializing...' : 'Initialize Sibling Discount Settings'}
                    </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { key: 'secondChildDiscount', label: '2nd Child' },
                      { key: 'thirdChildDiscount', label: '3rd Child' },
                      { key: 'fourthChildDiscount', label: '4th Child' },
                      { key: 'fifthChildDiscount', label: '5th Child' },
                      { key: 'maxDiscountPerChild', label: 'Max % Cap' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-medium dark:text-gray-400 block mb-1">{f.label} (%)</label>
                        <Input type="number" min="0" max="100" value={siblingDiscount[f.key] || 0}
                          onChange={e => setSiblingDiscount((prev: any) => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                          onBlur={e => saveSiblingDiscount(f.key, parseFloat(e.target.value))} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium dark:text-gray-400 block mb-1">Apply To</label>
                      <Select value={siblingDiscount.applyTo || 'ALL'} onValueChange={v => saveSiblingDiscount('applyTo', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Components</SelectItem>
                          <SelectItem value="MANDATORY_ONLY">Mandatory Only</SelectItem>
                          <SelectItem value="TUITION_ONLY">Tuition Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium dark:text-gray-400 block mb-1">Status</label>
                      <div className="flex items-center h-10 px-3 rounded-md border dark:border-gray-700 dark:bg-gray-800">
                        <Badge className={siblingDiscount.isEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}>
                          {siblingDiscount.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Discount Types</CardTitle>
                <CardDescription className="dark:text-gray-400">Scholarship, staff discount, early payment, merit, etc.</CardDescription>
              </div>
              <Dialog open={showDiscountTypeDialog} onOpenChange={v => { setShowDiscountTypeDialog(v); if (!v) setEditingDiscountType(null); }}>
                <DialogTrigger asChild><Button size="sm" onClick={() => setEditingDiscountType(null)}><Plus className="w-4 h-4 mr-1" />Add Type</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingDiscountType ? 'Edit Discount Type' : 'Create Discount Type'}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Name (e.g., Scholarship)" value={editingDiscountType ? editingDiscountType.name : newDiscountType.name} onChange={e => editingDiscountType ? setEditingDiscountType(p => ({ ...p, name: e.target.value })) : setNewDiscountType(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Code (e.g., SCHOLARSHIP)" value={editingDiscountType ? editingDiscountType.code : newDiscountType.code} onChange={e => editingDiscountType ? setEditingDiscountType(p => ({ ...p, code: e.target.value.toUpperCase() })) : setNewDiscountType(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" placeholder="Discount %" value={editingDiscountType ? editingDiscountType.discountPercentage : newDiscountType.discountPercentage} onChange={e => editingDiscountType ? setEditingDiscountType(p => ({ ...p, discountPercentage: e.target.value })) : setNewDiscountType(p => ({ ...p, discountPercentage: e.target.value }))} />
                      <Input type="number" placeholder="Max per student %" value={editingDiscountType ? editingDiscountType.maxDiscountPerStudent : newDiscountType.maxDiscountPerStudent} onChange={e => editingDiscountType ? setEditingDiscountType(p => ({ ...p, maxDiscountPerStudent: e.target.value })) : setNewDiscountType(p => ({ ...p, maxDiscountPerStudent: e.target.value }))} />
                    </div>
                    <Select value={editingDiscountType ? editingDiscountType.appliesTo : newDiscountType.appliesTo} onValueChange={v => editingDiscountType ? setEditingDiscountType(p => ({ ...p, appliesTo: v })) : setNewDiscountType(p => ({ ...p, appliesTo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Applies To" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Components</SelectItem>
                        <SelectItem value="MANDATORY_ONLY">Mandatory Only</SelectItem>
                        <SelectItem value="TUITION_ONLY">Tuition Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Checkbox id="reqApproval" checked={editingDiscountType ? editingDiscountType.requiresApproval : newDiscountType.requiresApproval} onCheckedChange={v => editingDiscountType ? setEditingDiscountType(p => ({ ...p, requiresApproval: !!v })) : setNewDiscountType(p => ({ ...p, requiresApproval: !!v }))} />
                      <Label htmlFor="reqApproval" className="text-sm">Requires approval before applying</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="isActive" checked={editingDiscountType ? editingDiscountType.isActive : true} onCheckedChange={v => editingDiscountType ? setEditingDiscountType(p => ({ ...p, isActive: !!v })) : null} />
                      <Label htmlFor="isActive" className="text-sm">Active</Label>
                    </div>
                    <Button onClick={editingDiscountType ? () => updateDiscountType(editingDiscountType.id) : createDiscountType} disabled={loading} className="w-full">{loading ? 'Saving...' : editingDiscountType ? 'Update Discount Type' : 'Create Discount Type'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Name</TableHead>
                  <TableHead className="dark:text-gray-300">Code</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Discount %</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Max/Student</TableHead>
                  <TableHead className="dark:text-gray-300">Applies To</TableHead>
                  <TableHead className="dark:text-gray-300">Approval</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {discountTypes.map(dt => (
                    <TableRow key={dt.id} className="dark:border-gray-700">
                      <TableCell className="font-medium dark:text-white">{dt.name}</TableCell>
                      <TableCell><Badge variant="outline" className="dark:border-gray-600 font-mono">{dt.code}</Badge></TableCell>
                      <TableCell className="text-right dark:text-white">{dt.discountPercentage}%</TableCell>
                      <TableCell className="text-right dark:text-gray-300">{dt.maxDiscountPerStudent}%</TableCell>
                      <TableCell className="dark:text-gray-300">{dt.appliesTo}</TableCell>
                      <TableCell className="dark:text-gray-300">{dt.requiresApproval ? 'Yes' : 'Auto'}</TableCell>
                      <TableCell><Badge className={dt.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800' : 'bg-gray-100 dark:bg-gray-700'}>{dt.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7" onClick={() => { setEditingDiscountType(dt); setShowDiscountTypeDialog(true); }}>Edit</Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-600" onClick={() => deleteDiscountType(dt.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {discountTypes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No discount types. Create one above.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Student Discounts</CardTitle>
                <CardDescription className="dark:text-gray-400">Apply discount types to individual students</CardDescription>
              </div>
              <Dialog open={showApplyDiscountDialog} onOpenChange={setShowApplyDiscountDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Apply Discount</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Apply Discount to Student</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input placeholder="Search student..." value={applyDiscountForm.studentSearch}
                        onChange={e => { setApplyDiscountForm(p => ({ ...p, studentSearch: e.target.value })); fetchStudents(e.target.value); }} />
                      {applyDiscountForm.studentSearch && applyStudents.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {applyStudents.filter(s => `${s.lastName} ${s.firstName} ${s.studentId}`.toLowerCase().includes(applyDiscountForm.studentSearch.toLowerCase())).slice(0, 10).map(s => (
                            <div key={s.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white"
                              onClick={() => { setApplyDiscountForm(p => ({ ...p, studentId: s.id, studentSearch: `${s.lastName} ${s.firstName} (${s.studentId})` })); setApplyStudents([]); }}>
                              {s.lastName} {s.firstName} ({s.studentId})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Select value={applyDiscountForm.discountTypeId} onValueChange={v => setApplyDiscountForm(p => ({ ...p, discountTypeId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select discount type" /></SelectTrigger>
                      <SelectContent>
                        {discountTypes.filter(d => d.isActive).length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">No active discount types. Create one above.</div>
                        ) : (
                          discountTypes.filter(d => d.isActive).map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              <div className="flex items-center gap-2">
                                <span>{d.name}</span>
                                <span className="text-gray-400">({d.discountPercentage}%)</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{d.code}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Override discount % (optional)" value={applyDiscountForm.discountPercentage}
                      onChange={e => setApplyDiscountForm(p => ({ ...p, discountPercentage: e.target.value }))} />
                    <Input placeholder="Reason/Note (optional)" value={applyDiscountForm.reason}
                      onChange={e => setApplyDiscountForm(p => ({ ...p, reason: e.target.value }))} />
                    <Button onClick={applyDiscount} disabled={loading} className="w-full">{loading ? 'Applying...' : 'Apply Discount'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="dark:text-gray-300">Discount Type</TableHead>
                  <TableHead className="text-right dark:text-gray-300">%</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {studentDiscounts.map(d => (
                    <TableRow key={d.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{d.student?.firstName} {d.student?.lastName} <span className="text-gray-500 text-xs">({d.student?.studentId})</span></TableCell>
                      <TableCell className="dark:text-gray-300">{d.discountType?.name}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{d.discountPercentage}%</TableCell>
                      <TableCell><Badge className={d.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800' : d.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800' : 'bg-red-100 dark:bg-red-900/30 text-red-800'}>{d.status?.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        {d.status === 'PENDING_APPROVAL' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-green-600" onClick={() => approveRejectDiscount(d.id, 'approve')}>Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-600" onClick={() => approveRejectDiscount(d.id, 'reject')}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {studentDiscounts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No student discounts applied yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => exportDiscountsToExcel()}>
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportDiscountsToPDF()}>
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
            <DialogDescription>{studentSearch}</DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-1 text-sm">
                <p>Total Bill: <strong>{formatCurrency(selectedBill.totalAmount)}</strong></p>
                <p>Previously Paid: <strong className="text-green-600">{formatCurrency(selectedBill.amountPaid)}</strong></p>
                <p>Balance: <strong className="text-red-600">{formatCurrency(selectedBill.balance)}</strong></p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Fee Items (enter payment amount per item):</p>
                {paymentItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">{item.componentName}</p>
                      <p className="text-xs text-gray-500">Due: {formatCurrency(item.amountDue)} | Outstanding: {formatCurrency(item.outstanding)}</p>
                    </div>
                    <div className="w-32">
                      <Input type="number" placeholder="0" value={item.paymentAmount} onChange={e => updateItemPayment(idx, e.target.value)} className="text-right" />
                    </div>
                  </div>
                ))}
                <div className="border-t dark:border-gray-700 pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total This Payment:</span>
                    <span className="text-green-600">{formatCurrency(totalPayment)}</span>
                  </div>
                </div>
                <Button onClick={recordPayment} disabled={loading || totalPayment <= 0} className="w-full">{loading ? 'Processing...' : `Record Payment (${formatCurrency(totalPayment)})`}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPaymentDialog} onOpenChange={(open) => { if (!open) resetPaymentForm(); setShowAddPaymentDialog(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
            <DialogDescription>Record a payment received from a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Academic Year *</Label>
                <Select value={paymentYear} onValueChange={v => { setPaymentYear(v); setPaymentTerm(''); setPaymentStudent(null); setPaymentItemsManual([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term *</Label>
                <Select value={paymentTerm} onValueChange={v => { setPaymentTerm(v); setPaymentStudent(null); setPaymentItemsManual([]); }} disabled={!paymentYear}>
                  <SelectTrigger><SelectValue placeholder="Select Term" /></SelectTrigger>
                  <SelectContent>{terms.filter(t => t.academicYearId === paymentYear).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label>Student</Label>
                <Input 
                  placeholder="Search by name or ID..." 
                  value={paymentStudentSearch}
                  onFocus={() => paymentStudentResults.length > 0 && setPaymentStudentShowDropdown(true)}
                  onBlur={() => setTimeout(() => setPaymentStudentShowDropdown(false), 200)}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setPaymentStudentSearch(val);
                    if (val.length >= 2) {
                      try {
                        const res = await authFetch(`/api/sms/students?search=${encodeURIComponent(val)}&limit=10`);
                        if (res.ok) {
                          const data = await res.json();
                          setPaymentStudentResults(data.students || []);
                          setPaymentStudentShowDropdown(true);
                        }
                      } catch {}
                    } else {
                      setPaymentStudentResults([]);
                      setPaymentStudentShowDropdown(false);
                    }
                  }}
                />
                {paymentStudentShowDropdown && paymentStudentResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {paymentStudentResults.map((s: any) => (
                      <div 
                        key={s.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        onClick={() => {
                          setPaymentStudent(s);
                          setPaymentStudentSearch('');
                          setPaymentStudentShowDropdown(false);
                          setPaymentStudentResults([]);
                        }}
                      >
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <span className="text-gray-500 text-sm ml-2">({s.studentId})</span>
                      </div>
                    ))}
                  </div>
                )}
                {paymentStudent && !paymentStudentShowDropdown && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium dark:text-white">{paymentStudent.firstName} {paymentStudent.lastName}</span>
                      <span className="text-gray-500"> ({paymentStudent.studentId})</span>
                    </div>
                    <button 
                      type="button"
                      className="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => {
                        setPaymentStudent(null);
                        setPaymentStudentSearch('');
                        setPaymentItemsManual([]);
                        setPaymentBill(null);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="POS">POS Terminal</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference/Transaction ID</Label>
                <Input placeholder="e.g. TRF-123456" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Amount (NGN)</Label>
              <Input type="number" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            </div>
            {paymentStudent && paymentItemsManual.length > 0 && (
              <div className="border dark:border-gray-700 rounded p-3">
                <p className="text-sm font-medium mb-2 dark:text-white">Select Fee Components to Pay:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {paymentItemsManual.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={item.allocate} 
                          onCheckedChange={(checked) => {
                            const items = [...paymentItemsManual];
                            items[idx].allocate = checked;
                            if (checked) {
                              items[idx].allocationAmount = Math.min(item.outstanding, parseFloat(paymentAmount) || 0).toString();
                            } else {
                              items[idx].allocationAmount = '';
                            }
                            setPaymentItemsManual(items);
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium dark:text-white">{item.componentName}</p>
                          <p className="text-xs text-gray-500">Outstanding: {formatCurrency(item.outstanding)}</p>
                        </div>
                      </div>
                      {item.allocate && (
                        <Input 
                          type="number" 
                          placeholder="Amount"
                          className="w-28 text-right"
                          value={item.allocationAmount || ''}
                          onChange={e => {
                            const items = [...paymentItemsManual];
                            items[idx].allocationAmount = e.target.value;
                            setPaymentItemsManual(items);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {paymentStudent && paymentItemsManual.length === 0 && (
              <p className="text-sm text-gray-500">No outstanding fees found for this student.</p>
            )}
            <Button 
              onClick={recordManualPayment} 
              disabled={loading || !paymentStudent || !paymentAmount || !paymentYear || !paymentTerm}
              className="w-full"
            >
              {loading ? 'Processing...' : `Record Payment (${paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : ''})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegStudentDialog} onOpenChange={setShowRegStudentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Student for Fees</DialogTitle>
            <DialogDescription>Help students select their optional fee components</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student *</Label>
              <div className="relative">
                <Input 
                  placeholder="Search by name..." 
                  value={regStudentSearch}
                  onFocus={() => regStudentResults.length > 0 && setRegStudentShowDropdown(true)}
                  onBlur={() => setTimeout(() => setRegStudentShowDropdown(false), 200)}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setRegStudentSearch(val);
                    if (val.length >= 2) {
                      try {
                        const res = await authFetch(`/api/sms/students?search=${encodeURIComponent(val)}&limit=10`);
                        if (res.ok) {
                          const data = await res.json();
                          setRegStudentResults(data.students || []);
                          setRegStudentShowDropdown(true);
                        }
                      } catch {}
                    } else {
                      setRegStudentResults([]);
                      setRegStudentShowDropdown(false);
                    }
                  }}
                />
                {regStudentShowDropdown && regStudentResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {regStudentResults.map((s: any) => (
                      <div 
                        key={s.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        onClick={() => {
                          setRegStudent(s);
                          setRegStudentSearch(`${s.firstName} ${s.lastName}`);
                          setRegStudentShowDropdown(false);
                          setRegStudentResults([]);
                          loadOptionalComponents(s.id);
                        }}
                      >
                        {s.firstName} {s.lastName} <span className="text-gray-500 text-xs">({s.studentId})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {regStudent && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm flex justify-between items-center">
                  <div>
                    <span className="font-medium dark:text-white">{regStudent.firstName} {regStudent.lastName}</span>
                    <span className="text-gray-500"> ({regStudent.studentId})</span>
                  </div>
                  <button 
                    type="button"
                    className="text-red-500 hover:text-red-700 text-sm"
                    onClick={() => { setRegStudent(null); setRegStudentSearch(''); setRegOptionalComponents([]); }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            {regStudent && (
              <div>
                <Label>Fee Components</Label>
                <p className="text-xs text-gray-500 mb-2">Select which fee components apply to this student:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto border dark:border-gray-700 rounded p-3">
                  {components.length === 0 ? (
                    <p className="text-sm text-gray-500">No fee components available. Please create fee components first.</p>
                  ) : (
                    components.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={regOptionalComponents.some((rc: any) => rc.componentId === c.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRegOptionalComponents([...regOptionalComponents, { componentId: c.id, componentName: c.name, amount: c.amount }]);
                              } else {
                                setRegOptionalComponents(regOptionalComponents.filter((rc: any) => rc.componentId !== c.id));
                              }
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium dark:text-white">{c.name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(c.amount)} - {c.category}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {regOptionalComponents.length > 0 && (
                  <p className="text-sm font-medium mt-2 dark:text-white">
                    Selected: {regOptionalComponents.map((c: any) => c.componentName).join(', ')}
                  </p>
                )}
              </div>
            )}
            <Button 
              onClick={saveStudentRegistration} 
              disabled={loading || !regStudent}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Registration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}