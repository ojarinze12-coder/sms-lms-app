'use client';

import { Loader2, ArrowLeft, ArrowRight, Users, Check } from 'lucide-react';
import { DEFAULT_SSS_DEPARTMENTS } from '@/lib/constants/departments';
import type { DepartmentWithCount } from '@/types/setup';

interface Step3DepartmentsProps {
  existingDepartments: DepartmentWithCount[];
  selectedDepts: string[];
  submitting: boolean;
  onSelectedDeptsChange: (depts: string[]) => void;
  onSave: () => void;
  onBack: () => void;
}

export default function Step3Departments({
  existingDepartments,
  selectedDepts,
  submitting,
  onSelectedDeptsChange,
  onSave,
  onBack,
}: Step3DepartmentsProps) {
  const handleDeptToggle = (code: string, checked: boolean) => {
    if (checked) {
      onSelectedDeptsChange([...selectedDepts, code]);
    } else {
      onSelectedDeptsChange(selectedDepts.filter((d) => d !== code));
    }
  };

  const hasExistingDepartments = existingDepartments.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">SSS Departments</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {hasExistingDepartments
              ? 'Your departments are already configured'
              : 'Configure streams for Senior Secondary School'}
          </p>
        </div>
      </div>

      {hasExistingDepartments ? (
        <div className="mb-6">
          <h3 className="font-medium mb-3 dark:text-white">Current Departments:</h3>
          <div className="grid grid-cols-3 gap-3">
            {existingDepartments.map((dept) => (
              <div key={dept.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="font-medium dark:text-white">{dept.name}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  {dept._count?.subjects || 0} subjects
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-4 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Departments already configured
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Select which departments to create for SSS:
          </p>
          <div className="space-y-3 mb-6">
            {DEFAULT_SSS_DEPARTMENTS.map((dept) => (
              <label
                key={dept.code}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedDepts.includes(dept.code)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDepts.includes(dept.code)}
                  onChange={(e) => handleDeptToggle(dept.code, e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <div className="font-medium dark:text-white">{dept.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dept.subjects.slice(0, 4).join(', ')}
                    {dept.subjects.length > 4 && ` +${dept.subjects.length - 4} more`}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-between gap-3 mt-6 pt-6 border-t dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onSave}
          disabled={submitting || (!hasExistingDepartments && selectedDepts.length === 0)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasExistingDepartments ? 'Continue' : 'Save & Continue'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
