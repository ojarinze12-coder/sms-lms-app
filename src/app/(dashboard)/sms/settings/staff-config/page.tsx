'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function StaffConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    teacherPositions: [] as string[],
    staffCategories: [] as string[],
    staffDepartments: [] as string[],
    staffPositions: [] as string[],
  });

  const [newValues, setNewValues] = useState({
    teacherPosition: '',
    staffCategory: '',
    staffDepartment: '',
    staffPosition: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await authFetch('/api/sms/staff-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/sms/staff-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast({ description: 'Staff configuration saved successfully' });
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to save' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: keyof typeof config, value: string) => {
    if (!value.trim()) return;
    if (config[type].includes(value.trim())) {
      toast({ variant: 'destructive', description: 'Item already exists' });
      return;
    }
    setConfig({ ...config, [type]: [...config[type], value.trim()] });
    setNewValues({ ...newValues, [type]: '' });
  };

  const removeItem = (type: keyof typeof config, index: number) => {
    const newArray = [...config[type]];
    newArray.splice(index, 1);
    setConfig({ ...config, [type]: newArray });
  };

  const getLabel = (type: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      teacherPositions: {
        PRINCIPAL: 'Principal', VICE_PRINCIPAL: 'Vice Principal', HOD: 'Head of Department',
        SENIOR_TEACHER: 'Senior Teacher', CLASS_TEACHER: 'Class Teacher', FORM_MASTER: 'Form Master/Mistress',
        SUBJECT_TEACHER: 'Subject Teacher', ASSISTANT_TEACHER: 'Assistant Teacher',
      },
      staffCategories: {
        ADMINISTRATIVE: 'Administrative', BURSAR: 'Bursar/Finance', LIBRARIAN: 'Librarian',
        SECURITY: 'Security', CLEANER: 'Cleaner', DRIVER: 'Driver', COOK: 'Cook',
        MAINTENANCE: 'Maintenance', IT_SUPPORT: 'IT Support', COUNSELOR: 'Counselor', NURSE: 'Nurse', TRANSPORT: 'Transport',
      },
      staffDepartments: {
        FINANCE: 'Finance', ADMINISTRATION: 'Administration', TRANSPORT: 'Transport',
        LIBRARY: 'Library', ICT: 'ICT', SECURITY: 'Security', MEDICAL: 'Medical', KITCHEN: 'Kitchen', MAINTENANCE: 'Maintenance',
      },
      staffPositions: {
        BURSAR: 'Bursar', ACCOUNTANT: 'Accountant', CASHIER: 'Cashier', ADMIN_OFFICER: 'Admin Officer',
        RECEPTIONIST: 'Receptionist', LIBRARIAN: 'Librarian', LIBRARY_ASSISTANT: 'Library Assistant',
        CHIEF_SECURITY: 'Chief Security Officer', SECURITY_GUARD: 'Security Guard', TRANSPORT_MANAGER: 'Transport Manager',
        DRIVER: 'Driver', NURSE: 'Nurse', MEDICAL_OFFICER: 'Medical Officer', COOK: 'Cook',
        KITCHEN_STAFF: 'Kitchen Staff', MAINTENANCE_OFFICER: 'Maintenance Officer', IT_SUPPORT_SPECIALIST: 'IT Support Specialist',
      },
    };
    return labels[type]?.[value] || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/sms/hr" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            ← Back to HR
          </Link>
          <h1 className="text-2xl font-bold mt-2 dark:text-white">Staff Configuration</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure staff positions, categories, departments, and roles</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Teacher Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Teacher Positions</CardTitle>
          <CardDescription className="dark:text-gray-400">Available positions for teaching staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new teacher position"
              value={newValues.teacherPosition}
              onChange={(e) => setNewValues({ ...newValues, teacherPosition: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addItem('teacherPositions', newValues.teacherPosition)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            <Button type="button" onClick={() => addItem('teacherPositions', newValues.teacherPosition)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.teacherPositions.map((pos, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm dark:text-gray-200">{getLabel('teacherPositions', pos)}</span>
                <button onClick={() => removeItem('teacherPositions', idx)} className="text-gray-500 dark:text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Staff Categories</CardTitle>
          <CardDescription className="dark:text-gray-400">Categories for non-teaching staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new staff category"
              value={newValues.staffCategory}
              onChange={(e) => setNewValues({ ...newValues, staffCategory: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addItem('staffCategories', newValues.staffCategory)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            <Button type="button" onClick={() => addItem('staffCategories', newValues.staffCategory)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.staffCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm dark:text-gray-200">{getLabel('staffCategories', cat)}</span>
                <button onClick={() => removeItem('staffCategories', idx)} className="text-gray-500 dark:text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Departments */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Staff Departments</CardTitle>
          <CardDescription className="dark:text-gray-400">Departments for non-teaching staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new department"
              value={newValues.staffDepartment}
              onChange={(e) => setNewValues({ ...newValues, staffDepartment: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addItem('staffDepartments', newValues.staffDepartment)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            <Button type="button" onClick={() => addItem('staffDepartments', newValues.staffDepartment)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.staffDepartments.map((dept, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm dark:text-gray-200">{getLabel('staffDepartments', dept)}</span>
                <button onClick={() => removeItem('staffDepartments', idx)} className="text-gray-500 dark:text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Staff Positions</CardTitle>
          <CardDescription className="dark:text-gray-400">Positions for non-teaching staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new staff position"
              value={newValues.staffPosition}
              onChange={(e) => setNewValues({ ...newValues, staffPosition: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addItem('staffPositions', newValues.staffPosition)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            <Button type="button" onClick={() => addItem('staffPositions', newValues.staffPosition)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.staffPositions.map((pos, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm dark:text-gray-200">{getLabel('staffPositions', pos)}</span>
                <button onClick={() => removeItem('staffPositions', idx)} className="text-gray-500 dark:text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}