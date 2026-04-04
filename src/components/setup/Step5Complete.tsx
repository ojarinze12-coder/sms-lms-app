'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { CURRICULUM_INFO } from '@/types';
import type { TierWithCount, DepartmentWithCount } from '@/types/setup';

interface Step5CompleteProps {
  existingTiers: TierWithCount[];
  existingDepartments: DepartmentWithCount[];
  curriculum: string;
  badgesEnabled: boolean;
  badgesAutoAward: boolean;
  daysPerWeek: number;
  periodDuration: number;
  schoolStartTime: string;
  schoolEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  subjectsCreated?: number;
  classesCreated?: number;
}

export default function Step5Complete({
  existingTiers,
  existingDepartments,
  curriculum,
  badgesEnabled,
  badgesAutoAward,
  daysPerWeek,
  periodDuration,
  schoolStartTime,
  schoolEndTime,
  breakStartTime,
  breakEndTime,
  subjectsCreated = 0,
  classesCreated = 0,
}: Step5CompleteProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Setup Complete!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your school structure has been configured successfully.
      </p>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-medium mb-2 dark:text-white">Configuration Summary:</h3>
        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
          <li>• {existingTiers.length} Tiers configured</li>
          <li>• {existingDepartments.length} SSS Departments created</li>
          <li>• Curriculum: {CURRICULUM_INFO[curriculum as keyof typeof CURRICULUM_INFO]?.name || curriculum}</li>
          {subjectsCreated > 0 && (
            <li>• {classesCreated} Classes and {subjectsCreated} Subjects created</li>
          )}
          <li>• Badges: {badgesEnabled ? 'Enabled' : 'Disabled'}{badgesEnabled && ` (${badgesAutoAward ? 'Auto' : 'Manual'} award)`}</li>
          <li>• Timetable: {daysPerWeek} days/week, {periodDuration} min periods</li>
          <li>• School Hours: {schoolStartTime} - {schoolEndTime} (Break: {breakStartTime} - {breakEndTime})</li>
        </ul>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <Link
          href="/sms/tiers"
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          Manage Tiers
        </Link>
        <Link
          href="/sms/departments"
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          Manage Departments
        </Link>
        {badgesEnabled && (
          <Link
            href="/lms/badges"
            className="px-6 py-2 border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            Manage Badges
          </Link>
        )}
        <Link
          href="/sms/classes"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Classes
        </Link>
      </div>
    </div>
  );
}
