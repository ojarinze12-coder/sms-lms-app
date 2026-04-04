'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RotateCcw, Download, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DataSummary {
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
  tiersSetupComplete: boolean;
}

export default function DataManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/school/data');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (selectedTypes.length === 0) {
      toast({ variant: 'destructive', description: 'Please select at least one data type to clear' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/school/data/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', dataTypes: selectedTypes }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ description: `Successfully cleared ${selectedTypes.length} data type(s)` });
        setSelectedTypes([]);
        setShowConfirm(false);
        setConfirmText('');
        loadSummary();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to clear data' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to clear data' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSetup = async () => {
    if (confirmText !== 'RESET SETUP') {
      toast({ variant: 'destructive', description: 'Please type RESET SETUP to confirm' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/school/data/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetSetup' }),
      });

      if (res.ok) {
        toast({ description: 'School setup has been reset. Redirecting to setup...' });
        router.push('/sms/setup');
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to reset setup' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to reset setup' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWipeAll = async () => {
    if (confirmText !== 'WIPE ALL DATA') {
      toast({ variant: 'destructive', description: 'Please type WIPE ALL DATA to confirm' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/school/data/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wipeAll' }),
      });

      if (res.ok) {
        toast({ description: 'All data has been wiped. Redirecting to setup...' });
        router.push('/sms/setup');
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to wipe data' });
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

  const dataTypes = [
    { id: 'students', label: 'Students', count: summary?.students || 0 },
    { id: 'teachers', label: 'Teachers', count: summary?.teachers || 0 },
    { id: 'staff', label: 'Staff', count: summary?.staff || 0 },
    { id: 'parents', label: 'Parents', count: summary?.parents || 0 },
    { id: 'classes', label: 'Classes', count: summary?.classes || 0 },
    { id: 'enrollments', label: 'Enrollments', count: summary?.enrollments || 0 },
    { id: 'attendance', label: 'Attendance Records', count: summary?.attendances || 0 },
    { id: 'announcements', label: 'Announcements', count: summary?.announcements || 0 },
    { id: 'feePayments', label: 'Fee Payments', count: summary?.feePayments || 0 },
    { id: 'feeStructures', label: 'Fee Structures', count: summary?.feeStructures || 0 },
    { id: 'results', label: 'Exam Results', count: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Data Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your school's data - clear test data, reset setup, or wipe all data</p>
      </div>

      {/* Current Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Data Summary</CardTitle>
          <CardDescription className="dark:text-gray-400">Current records in your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.students || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.teachers || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Teachers</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.classes || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Classes</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.parents || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Parents</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.tiers || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tiers</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.departments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Departments</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.feePayments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fee Payments</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold dark:text-white">{summary?.tiersSetupComplete ? '✓' : '✗'}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Setup Complete</div>
            </div>
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
            Select specific data types to remove test records
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
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Clear {selectedTypes.length} Data Type(s)
              </Button>
              <Button variant="outline" onClick={() => setSelectedTypes([])}>
                Clear Selection
              </Button>
            </div>
          )}

          {showConfirm && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Warning: This action cannot be undone!</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                You are about to clear: {selectedTypes.join(', ')}
              </p>
              <Button variant="destructive" onClick={handleClearData} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm Clear
              </Button>
              <Button variant="ghost" onClick={() => setShowConfirm(false)} className="ml-2">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset School Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reset School Setup
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Remove tiers, classes, subjects, and departments to run the setup wizard again
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will remove: Tiers, Classes, Subjects, Departments, and Enrollments. 
            Student, Teacher, and Parent records will be kept.
          </p>
          
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

      {/* Add Missing Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add Missing Subjects
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Automatically add missing subjects to all classes based on curriculum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will check all classes and add any missing subjects based on the configured curriculum for each tier.
            You can also choose to create missing classes for each tier. Existing subjects will not be affected.
          </p>
          
          <Button onClick={async () => {
            if (!confirm('Add missing subjects and/or classes based on curriculum?')) return;
            setSubmitting(true);
            try {
              const res = await fetch('/api/sms/subjects/add-missing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ createMissingClasses: true }),
              });
              const data = await res.json();
              console.log('[ADD-MISSING] Response:', JSON.stringify(data, null, 2));
              if (res.ok) {
                toast({ description: `Classes: ${data.classesCreated}, Subjects: ${data.subjectsCreated}\nDebug: ${JSON.stringify(data.debug)}` });
              } else {
                toast({ variant: 'destructive', description: 'Error: ' + JSON.stringify(data) });
              }
            } catch (err) {
              toast({ variant: 'destructive', description: 'Exception: ' + err });
            } finally {
              setSubmitting(false);
            }
          }} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Add Missing Subjects & Classes
          </Button>
        </CardContent>
      </Card>

      {/* Wipe All Data */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Wipe All Data
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Permanently delete ALL school data and reset everything
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete ALL data including students, teachers, classes, 
            attendance, fees, results, and reset the setup wizard. This action cannot be undone!
          </p>
          
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
