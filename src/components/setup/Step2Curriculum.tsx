'use client';

import { Loader2, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { CURRICULUM_INFO } from '@/types';
import type { Curriculum } from '@prisma/client';
import type { TierWithCount } from '@/types/setup';

interface Step2CurriculumProps {
  existingTiers: TierWithCount[];
  curriculum: Curriculum;
  usePerTierCurriculum: boolean;
  tierCurriculum: Record<string, Curriculum>;
  daysPerWeek: number;
  periodDuration: number;
  schoolStartTime: string;
  schoolEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  submitting: boolean;
  onCurriculumChange: (curriculum: Curriculum) => void;
  onUsePerTierCurriculumChange: (value: boolean) => void;
  onTierCurriculumChange: (tierId: string, curriculum: Curriculum) => void;
  onDaysPerWeekChange: (days: number) => void;
  onPeriodDurationChange: (minutes: number) => void;
  onSchoolStartTimeChange: (time: string) => void;
  onSchoolEndTimeChange: (time: string) => void;
  onBreakStartTimeChange: (time: string) => void;
  onBreakEndTimeChange: (time: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export default function Step2Curriculum({
  existingTiers,
  curriculum,
  usePerTierCurriculum,
  tierCurriculum,
  daysPerWeek,
  periodDuration,
  schoolStartTime,
  schoolEndTime,
  breakStartTime,
  breakEndTime,
  submitting,
  onCurriculumChange,
  onUsePerTierCurriculumChange,
  onTierCurriculumChange,
  onDaysPerWeekChange,
  onPeriodDurationChange,
  onSchoolStartTimeChange,
  onSchoolEndTimeChange,
  onBreakStartTimeChange,
  onBreakEndTimeChange,
  onSave,
  onBack,
}: Step2CurriculumProps) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Curriculum Settings</h2>
          <p className="text-gray-600 text-sm">
            Configure your school's curriculum
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Curriculum
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB'] as Curriculum[]).map((curr) => (
              <button
                key={curr}
                onClick={() => onCurriculumChange(curr)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  curriculum === curr
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{CURRICULUM_INFO[curr].name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {CURRICULUM_INFO[curr].description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={usePerTierCurriculum}
              onChange={(e) => onUsePerTierCurriculumChange(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-700">Different curriculum per tier</div>
              <div className="text-sm text-gray-500">
                Select this if you offer multiple curricula across different tiers
              </div>
            </div>
          </label>

          {usePerTierCurriculum && existingTiers.length > 0 && (
            <div className="mt-4 pl-7 space-y-3">
              {existingTiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium">{tier.name}:</span>
                  <select
                    value={tierCurriculum[tier.id] || curriculum}
                    onChange={(e) =>
                      onTierCurriculumChange(tier.id, e.target.value as Curriculum)
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  >
                    {(['NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB'] as Curriculum[]).map((curr) => (
                      <option key={curr} value={curr}>
                        {CURRICULUM_INFO[curr].name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timetable Settings */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-medium text-gray-900 mb-4">Timetable Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days per Week
              </label>
              <select
                value={daysPerWeek}
                onChange={(e) => onDaysPerWeekChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={5}>5 Days (Mon-Fri)</option>
                <option value={6}>6 Days (Mon-Sat)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Duration (minutes)
              </label>
              <select
                value={periodDuration}
                onChange={(e) => onPeriodDurationChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={30}>30 minutes</option>
                <option value={35}>35 minutes</option>
                <option value={40}>40 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Start Time
              </label>
              <input
                type="time"
                value={schoolStartTime}
                onChange={(e) => onSchoolStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School End Time
              </label>
              <input
                type="time"
                value={schoolEndTime}
                onChange={(e) => onSchoolEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Start Time
              </label>
              <input
                type="time"
                value={breakStartTime}
                onChange={(e) => onBreakStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break End Time
              </label>
              <input
                type="time"
                value={breakEndTime}
                onChange={(e) => onBreakEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onSave}
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & Continue
        </button>
      </div>
    </div>
  );
}
