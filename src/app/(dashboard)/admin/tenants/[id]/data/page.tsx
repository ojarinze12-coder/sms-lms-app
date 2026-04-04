'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, RotateCcw, AlertTriangle, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TenantData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  };
  records: {
    students: number;
    teachers: number;
    staff: number;
    parents: number;
    classes: number;
    subjects: number;
    tiers: number;
    departments: number;
    enrollments: number;
    feePayments: number;
    attendances: number;
    announcements: number;
    feeStructures: number;
    users: number;
    academicYears: number;
    terms: number;
  };
  tiersSetupComplete: boolean;
}

export default function TenantDataManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<TenantData | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');

  const tenantId = params.id as string;

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/data`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to load tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (selectedTypes.length === 0) {
      toast({ variant: 'destructive', description: 'Please select at least one data type' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', dataTypes: selectedTypes }),
      });

      if (res.ok) {
        toast({ description: 'Data cleared successfully' });
        setSelectedTypes([]);
        loadData();
      } else {
        const result = await res.json();
        toast({ variant: 'destructive', description: result.error || 'Failed to clear data' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to clear data' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSetup = async () => {
    if (confirmText !== 'RESET SETUP') {
      toast({ variant: 'destructive', description: 'Type RESET SETUP to confirm' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', dataTypes: ['setup'] }),
      });

      if (res.ok) {
        toast({ description: 'School setup reset successfully' });
        setConfirmText('');
        loadData();
      } else {
        const result = await res.json();
        toast({ variant: 'destructive', description: result.error || 'Failed to reset setup' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to reset setup' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWipeAll = async () => {
    if (confirmText !== 'WIPE ALL DATA') {
      toast({ variant: 'destructive', description: 'Type WIPE ALL DATA to confirm' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wipeAll' }),
      });

      if (res.ok) {
        toast({ description: 'All data wiped successfully' });
        router.push('/admin/tenants');
      } else {
        const result = await res.json();
        toast({ variant: 'destructive', description: result.error || 'Failed to wipe data' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to wipe data' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const dataTypes = [
    { id: 'students', label: 'Students', count: data?.records.students || 0 },
    { id: 'teachers', label: 'Teachers', count: data?.records.teachers || 0 },
    { id: 'staff', label: 'Staff', count: data?.records.staff || 0 },
    { id: 'parents', label: 'Parents', count: data?.records.parents || 0 },
    { id: 'classes', label: 'Classes', count: data?.records.classes || 0 },
    { id: 'enrollments', label: 'Enrollments', count: data?.records.enrollments || 0 },
    { id: 'attendance', label: 'Attendance', count: data?.records.attendances || 0 },
    { id: 'announcements', label: 'Announcements', count: data?.records.announcements || 0 },
    { id: 'feePayments', label: 'Fee Payments', count: data?.records.feePayments || 0 },
    { id: 'feeStructures', label: 'Fee Structures', count: data?.records.feeStructures || 0 },
    { id: 'academicData', label: 'Academic Years & Terms', count: data?.records.academicYears || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tenant not found</p>
        <Link href="/admin/tenants">
          <Button variant="link">Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/tenants/${tenantId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Data Management</h1>
            <p className="text-gray-600 dark:text-gray-400">{data.tenant.name}</p>
          </div>
        </div>
        <Badge className={getStatusColor(data.tenant.status)}>
          {data.tenant.status}
        </Badge>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Data Summary</CardTitle>
          <CardDescription className="dark:text-gray-400">Current records for this tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dataTypes.slice(0, 8).map(type => (
              <div key={type.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold dark:text-white">{type.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{type.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-blue-700 dark:text-blue-300">
              Setup Status: {data.tiersSetupComplete ? 'Complete' : 'Not Complete'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Clear Selected Data */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Clear Selected Data
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Select specific data types to remove from this tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataTypes.map(type => (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                disabled={type.count === 0}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedTypes.includes(type.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${type.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium dark:text-white">{type.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{type.count} records</div>
              </button>
            ))}
          </div>

          {selectedTypes.length > 0 && (
            <Button onClick={handleClearData} disabled={submitting} variant="destructive">
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear {selectedTypes.length} Data Type(s)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reset Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reset School Setup
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Reset tiers, classes, subjects, and departments for this school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Type "RESET SETUP" to confirm</span>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET SETUP"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-3"
            />
            <Button variant="destructive" onClick={handleResetSetup} disabled={submitting || confirmText !== 'RESET SETUP'}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Reset Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wipe All */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Wipe All Data
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Permanently delete ALL data for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Type "WIPE ALL DATA" to confirm</span>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type WIPE ALL DATA"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-3"
            />
            <Button variant="destructive" onClick={handleWipeAll} disabled={submitting || confirmText !== 'WIPE ALL DATA'}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Wipe All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
