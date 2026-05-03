'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface AllowanceConfig {
  id: string;
  name: string;
  description: string | null;
  type: string;
  defaultValue: number | null;
  isActive: boolean;
  isTaxable: boolean;
}

interface DeductionConfig {
  id: string;
  name: string;
  description: string | null;
  type: string;
  defaultRate: number | null;
  isActive: boolean;
  isMandatory: boolean;
  isPaye: boolean;
}

interface TeacherAllowance {
  id: string;
  teacherId: string;
  configId: string;
  value: number | null;
  isCustom: boolean;
  teacher: { id: string; firstName: string; lastName: string; employeeId: string };
  config: { id: string; name: string; type: string };
}

interface TeacherDeduction {
  id: string;
  teacherId: string;
  configId: string;
  value: number | null;
  teacher: { id: string; firstName: string; lastName: string; employeeId: string };
  config: { id: string; name: string; type: string };
}

export default function PayrollSettingsPage() {
  const [activeTab, setActiveTab] = useState<'allowances' | 'deductions' | 'employee-config'>('allowances');
  const [allowances, setAllowances] = useState<AllowanceConfig[]>([]);
  const [deductions, setDeductions] = useState<DeductionConfig[]>([]);
  const [teacherAllowances, setTeacherAllowances] = useState<TeacherAllowance[]>([]);
  const [teacherDeductions, setTeacherDeductions] = useState<TeacherDeduction[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; firstName: string; lastName: string; employeeId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [showEmployeeConfigDialog, setShowEmployeeConfigDialog] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<AllowanceConfig | null>(null);
  const [editingDeduction, setEditingDeduction] = useState<DeductionConfig | null>(null);

  const [allowanceForm, setAllowanceForm] = useState({
    name: '',
    description: '',
    type: 'FIXED' as 'FIXED' | 'PERCENTAGE',
    defaultValue: '',
    isActive: true,
    isTaxable: true,
  });

  const [deductionForm, setDeductionForm] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE',
    defaultRate: '',
    isActive: true,
    isMandatory: true,
    isPaye: false,
  });

  const [employeeConfigForm, setEmployeeConfigForm] = useState({
    employeeType: 'TEACHER' as 'TEACHER' | 'STAFF',
    employeeId: '',
    configType: 'allowance' as 'allowance' | 'deduction',
    configId: '',
    value: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [allowancesRes, deductionsRes, configRes, teachersRes] = await Promise.all([
        authFetch('/api/sms/payroll/allowances'),
        authFetch('/api/sms/payroll/deductions'),
        authFetch('/api/sms/payroll/employee-config'),
        authFetch('/api/sms/teachers'),
      ]);

      const allowancesData = await allowancesRes.json();
      const deductionsData = await deductionsRes.json();
      const configData = await configRes.json();
      const teachersData = await teachersRes.json();

      setAllowances(Array.isArray(allowancesData) ? allowancesData : []);
      setDeductions(Array.isArray(deductionsData) ? deductionsData : []);
      setTeacherAllowances(Array.isArray(configData.teacherAllowances) ? configData.teacherAllowances : []);
      setTeacherDeductions(Array.isArray(configData.teacherDeductions) ? configData.teacherDeductions : []);
      
      const teachersList = Array.isArray(teachersData) ? teachersData : (Array.isArray(teachersData.data) ? teachersData.data : []);
      setTeachers(teachersList);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllowanceSubmit = async () => {
    try {
      const method = editingAllowance ? 'PATCH' : 'POST';
      const body = editingAllowance 
        ? { id: editingAllowance.id, ...allowanceForm, defaultValue: allowanceForm.defaultValue ? parseFloat(allowanceForm.defaultValue) : null }
        : { ...allowanceForm, defaultValue: allowanceForm.defaultValue ? parseFloat(allowanceForm.defaultValue) : null };

      const res = await authFetch('/api/sms/payroll/allowances', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowAllowanceDialog(false);
        setEditingAllowance(null);
        setAllowanceForm({ name: '', description: '', type: 'FIXED', defaultValue: '', isActive: true, isTaxable: true });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save allowance:', err);
    }
  };

  const handleDeductionSubmit = async () => {
    try {
      const method = editingDeduction ? 'PATCH' : 'POST';
      const body = editingDeduction
        ? { id: editingDeduction.id, ...deductionForm, defaultRate: deductionForm.defaultRate ? parseFloat(deductionForm.defaultRate) : null }
        : { ...deductionForm, defaultRate: deductionForm.defaultRate ? parseFloat(deductionForm.defaultRate) : null };

      const res = await authFetch('/api/sms/payroll/deductions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowDeductionDialog(false);
        setEditingDeduction(null);
        setDeductionForm({ name: '', description: '', type: 'PERCENTAGE', defaultRate: '', isActive: true, isMandatory: true, isPaye: false });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save deduction:', err);
    }
  };

  const handleEmployeeConfigSubmit = async () => {
    try {
      const res = await authFetch('/api/sms/payroll/employee-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeType: employeeConfigForm.employeeType,
          teacherId: employeeConfigForm.employeeType === 'TEACHER' ? employeeConfigForm.employeeId : undefined,
          staffId: employeeConfigForm.employeeType === 'STAFF' ? employeeConfigForm.employeeId : undefined,
          configId: employeeConfigForm.configId,
          value: employeeConfigForm.value ? parseFloat(employeeConfigForm.value) : undefined,
          isCustom: true,
        }),
      });

      if (res.ok) {
        setShowEmployeeConfigDialog(false);
        setEmployeeConfigForm({ employeeType: 'TEACHER', employeeId: '', configType: 'allowance', configId: '', value: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save employee config:', err);
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    if (!confirm('Delete this allowance configuration?')) return;
    try {
      const res = await authFetch(`/api/sms/payroll/allowances?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete allowance:', err);
    }
  };

  const handleDeleteDeduction = async (id: string) => {
    if (!confirm('Delete this deduction configuration?')) return;
    try {
      const res = await authFetch(`/api/sms/payroll/deductions?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete deduction:', err);
    }
  };

  const openEditAllowance = (allowance: AllowanceConfig) => {
    setEditingAllowance(allowance);
    setAllowanceForm({
      name: allowance.name,
      description: allowance.description || '',
      type: allowance.type as 'FIXED' | 'PERCENTAGE',
      defaultValue: allowance.defaultValue?.toString() || '',
      isActive: allowance.isActive,
      isTaxable: allowance.isTaxable,
    });
    setShowAllowanceDialog(true);
  };

  const openEditDeduction = (deduction: DeductionConfig) => {
    setEditingDeduction(deduction);
    setDeductionForm({
      name: deduction.name,
      description: deduction.description || '',
      type: deduction.type as 'FIXED' | 'PERCENTAGE',
      defaultRate: deduction.defaultRate?.toString() || '',
      isActive: deduction.isActive,
      isMandatory: deduction.isMandatory,
      isPaye: deduction.isPaye,
    });
    setShowDeductionDialog(true);
  };

  const configs = employeeConfigForm.configType === 'allowance' ? allowances : deductions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/sms/payroll" label="Back to Payroll" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Payroll Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure allowances, deductions, and employee salary settings</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 px-4 ${activeTab === 'allowances' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('allowances')}
        >
          Allowances ({allowances.length})
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'deductions' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('deductions')}
        >
          Deductions ({deductions.length})
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'employee-config' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('employee-config')}
        >
          Employee Configurations ({teacherAllowances.length + teacherDeductions.length})
        </button>
      </div>

      {activeTab === 'allowances' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingAllowance(null); setShowAllowanceDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Allowance
            </Button>
          </div>
          
          <div className="grid gap-4">
            {allowances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No allowance configurations. Add one to get started.</div>
            ) : (
              allowances.map((allowance) => (
                <Card key={allowance.id}>
                  <CardContent className="flex justify-between items-center py-4">
                    <div>
                      <h3 className="font-medium">{allowance.name}</h3>
                      <p className="text-sm text-gray-500">{allowance.description || 'No description'}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${allowance.type === 'FIXED' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {allowance.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${allowance.isTaxable ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          {allowance.isTaxable ? 'Taxable' : 'Non-taxable'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${allowance.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                          {allowance.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditAllowance(allowance)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteAllowance(allowance.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingDeduction(null); setShowDeductionDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Deduction
            </Button>
          </div>
          
          <div className="grid gap-4">
            {deductions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No deduction configurations. Add one to get started.</div>
            ) : (
              deductions.map((deduction) => (
                <Card key={deduction.id}>
                  <CardContent className="flex justify-between items-center py-4">
                    <div>
                      <h3 className="font-medium">{deduction.name}</h3>
                      <p className="text-sm text-gray-500">{deduction.description || 'No description'}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${deduction.type === 'FIXED' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {deduction.type}
                        </span>
                        {deduction.isPaye && (
                          <span className="px-2 py-0.5 rounded text-xs bg-orange-100">PAYE</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${deduction.isMandatory ? 'bg-red-100' : 'bg-gray-100'}`}>
                          {deduction.isMandatory ? 'Mandatory' : 'Optional'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${deduction.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                          {deduction.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDeduction(deduction)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteDeduction(deduction.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'employee-config' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowEmployeeConfigDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Employee Configuration
            </Button>
          </div>
          
          <div className="grid gap-4">
            {teacherAllowances.length === 0 && teacherDeductions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No employee-specific configurations. Add one to override default values.</div>
            ) : (
              <>
                {teacherAllowances.map((ta) => (
                  <Card key={ta.id}>
                    <CardContent className="flex justify-between items-center py-4">
                      <div>
                        <h3 className="font-medium">{ta.teacher.firstName} {ta.teacher.lastName}</h3>
                        <p className="text-sm text-gray-500">{ta.teacher.employeeId}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-100">Allowance: {ta.config.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-100">Value: {ta.value || 'Use default'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {teacherDeductions.map((td) => (
                  <Card key={td.id}>
                    <CardContent className="flex justify-between items-center py-4">
                      <div>
                        <h3 className="font-medium">{td.teacher.firstName} {td.teacher.lastName}</h3>
                        <p className="text-sm text-gray-500">{td.teacher.employeeId}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-xs bg-purple-100">Deduction: {td.config.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-100">Value: {td.value || 'Use default'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAllowance ? 'Edit Allowance' : 'Add Allowance'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input 
                value={allowanceForm.name}
                onChange={(e) => setAllowanceForm({ ...allowanceForm, name: e.target.value })}
                placeholder="e.g., Housing Allowance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input 
                value={allowanceForm.description}
                onChange={(e) => setAllowanceForm({ ...allowanceForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select 
                  value={allowanceForm.type} 
                  onValueChange={(v: 'FIXED' | 'PERCENTAGE') => setAllowanceForm({ ...allowanceForm, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Value</label>
                <Input 
                  type="number"
                  value={allowanceForm.defaultValue}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, defaultValue: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={allowanceForm.isActive}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, isActive: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={allowanceForm.isTaxable}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, isTaxable: e.target.checked })}
                />
                Taxable
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllowanceDialog(false)}>Cancel</Button>
            <Button onClick={handleAllowanceSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeduction ? 'Edit Deduction' : 'Add Deduction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input 
                value={deductionForm.name}
                onChange={(e) => setDeductionForm({ ...deductionForm, name: e.target.value })}
                placeholder="e.g., Pension"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input 
                value={deductionForm.description}
                onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select 
                  value={deductionForm.type} 
                  onValueChange={(v: 'FIXED' | 'PERCENTAGE') => setDeductionForm({ ...deductionForm, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Rate (%)</label>
                <Input 
                  type="number"
                  value={deductionForm.defaultRate}
                  onChange={(e) => setDeductionForm({ ...deductionForm, defaultRate: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={deductionForm.isActive}
                  onChange={(e) => setDeductionForm({ ...deductionForm, isActive: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={deductionForm.isMandatory}
                  onChange={(e) => setDeductionForm({ ...deductionForm, isMandatory: e.target.checked })}
                />
                Mandatory
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={deductionForm.isPaye}
                  onChange={(e) => setDeductionForm({ ...deductionForm, isPaye: e.target.checked })}
                />
                Is PAYE Tax
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeductionDialog(false)}>Cancel</Button>
            <Button onClick={handleDeductionSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeConfigDialog} onOpenChange={setShowEmployeeConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee Type</label>
              <Select 
                value={employeeConfigForm.employeeType} 
                onValueChange={(v: 'TEACHER' | 'STAFF') => setEmployeeConfigForm({ ...employeeConfigForm, employeeType: v, employeeId: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STAFF">Non-Teaching Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <Select 
                value={employeeConfigForm.employeeId} 
                onValueChange={(v) => setEmployeeConfigForm({ ...employeeConfigForm, employeeId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Configuration Type</label>
              <Select 
                value={employeeConfigForm.configType} 
                onValueChange={(v: 'allowance' | 'deduction') => setEmployeeConfigForm({ ...employeeConfigForm, configType: v, configId: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowance">Allowance</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{employeeConfigForm.configType === 'allowance' ? 'Allowance' : 'Deduction'}</label>
              <Select 
                value={employeeConfigForm.configId} 
                onValueChange={(v) => setEmployeeConfigForm({ ...employeeConfigForm, configId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {configs.map((config: any) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Custom Value (leave empty to use default)</label>
              <Input 
                type="number"
                value={employeeConfigForm.value}
                onChange={(e) => setEmployeeConfigForm({ ...employeeConfigForm, value: e.target.value })}
                placeholder="Use default"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeConfigDialog(false)}>Cancel</Button>
            <Button onClick={handleEmployeeConfigSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}