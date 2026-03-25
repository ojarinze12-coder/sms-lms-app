'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Calculator } from 'lucide-react';
import type { Teacher, PayrollFormData } from '@/types/payroll';
import { months } from '@/types/payroll';

interface PayrollFormProps {
  teachers: Teacher[];
  formData: PayrollFormData;
  onChange: (data: PayrollFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  calculatePayroll: () => {
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
}

export default function PayrollForm({
  teachers,
  formData,
  onChange,
  onSubmit,
  onCancel,
  calculatePayroll,
}: PayrollFormProps) {
  const calc = calculatePayroll();

  const handleChange = (field: keyof PayrollFormData, value: string | number) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Employee</label>
          <Select 
            value={formData.teacherId} 
            onValueChange={(v) => {
              const teacher = teachers.find(t => t.id === v);
              onChange({ 
                ...formData, 
                teacherId: v,
                basicSalary: teacher?.salary?.toString() || formData.basicSalary
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
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
          <label className="block text-sm font-medium mb-1">Period</label>
          <div className="flex gap-2">
            <Select value={formData.month.toString()} onValueChange={(v) => handleChange('month', parseInt(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              type="number" 
              className="w-24" 
              value={formData.year} 
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Earnings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1"> Basic Salary *</label>
            <Input 
              type="number" 
              value={formData.basicSalary} 
              onChange={(e) => handleChange('basicSalary', e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Housing Allowance</label>
            <Input 
              type="number" 
              value={formData.housingAllowance} 
              onChange={(e) => handleChange('housingAllowance', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transport Allowance</label>
            <Input 
              type="number" 
              value={formData.transportAllowance} 
              onChange={(e) => handleChange('transportAllowance', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Other Allowances</label>
            <Input 
              type="number" 
              value={formData.otherAllowances} 
              onChange={(e) => handleChange('otherAllowances', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Deductions (Nigerian Standards)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pension (%)</label>
            <Input 
              type="number" 
              value={formData.pensionRate} 
              onChange={(e) => handleChange('pensionRate', e.target.value)}
              placeholder="8"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PAYE Tax (%)</label>
            <Input 
              type="number" 
              value={formData.taxRate} 
              onChange={(e) => handleChange('taxRate', e.target.value)}
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NHF (%)</label>
            <Input 
              type="number" 
              value={formData.nhfRate} 
              onChange={(e) => handleChange('nhfRate', e.target.value)}
              placeholder="2.5"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Total Earnings:</span>
          <span className="font-medium">{calc.totalEarnings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Deductions:</span>
          <span className="font-medium text-red-600">-{calc.totalDeductions.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Net Pay:</span>
          <span className="text-green-600">{calc.netPay.toLocaleString()}</span>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Generate Payroll</Button>
      </DialogFooter>
    </form>
  );
}
