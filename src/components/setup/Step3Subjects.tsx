'use client';

import { Loader2, ArrowLeft, ArrowRight, BookOpen, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import { CURRICULUM_INFO } from '@/types';

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface Step3SubjectsProps {
  tiers: Tier[];
  curriculum: string;
  usePerTierCurriculum: boolean;
  tierCurriculum: Record<string, string>;
  submitting: boolean;
  onAddSubjects: (tierLevels: { tierId: string; level: number }[]) => void;
  onBack: () => void;
}

const TIER_LEVEL_RANGES: Record<string, number[]> = {
  'PRE-SCHOOL': [0, 1, 2, 3, 4],
  'PRE_NUR': [0, 1, 2, 3, 4],
  'PRE': [0, 1, 2, 3, 4],
  'NURSERY': [2, 3, 4],
  'NUR': [2, 3, 4],
  'PRIMARY': [5, 6, 7, 8, 9, 10],
  'PRI': [5, 6, 7, 8, 9, 10],
  'PRY': [5, 6, 7, 8, 9, 10],
  'JSS': [11, 12, 13],
  'JUNIOR': [11, 12, 13],
  'SSS': [14, 15, 16],
  'SENIOR': [14, 15, 16],
  'SS': [14, 15, 16],
};

const DEFAULT_TIER_LEVELS: Record<string, number[]> = {
  'PRE-SCHOOL': [0, 1, 2, 3, 4],
  'PRE_NUR': [0, 1, 2, 3, 4],
  'PRE': [0, 1, 2, 3, 4],
  'NURSERY': [2, 3, 4],
  'NUR': [2, 3, 4],
  'PRIMARY': [5, 6, 7, 8, 9, 10],
  'PRI': [5, 6, 7, 8, 9, 10],
  'PRY': [5, 6, 7, 8, 9, 10],
  'JSS': [11, 12, 13],
  'JUNIOR': [11, 12, 13],
  'SSS': [14, 15, 16],
  'SENIOR': [14, 15, 16],
  'SS': [14, 15, 16],
};

function getTierLevels(tierCode: string): number[] {
  const code = tierCode.toUpperCase().replace('_', '');
  for (const [key, levels] of Object.entries(TIER_LEVEL_RANGES)) {
    const keyNormal = key.toUpperCase().replace('_', '');
    if (code.includes(keyNormal) || keyNormal.includes(code) || code.startsWith(keyNormal)) {
      return levels;
    }
  }
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
}

export default function Step3Subjects({
  tiers,
  curriculum,
  usePerTierCurriculum,
  tierCurriculum,
  submitting,
  onAddSubjects,
  onBack,
}: Step3SubjectsProps) {
  const [selectedTiers, setSelectedTiers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    tiers.forEach(tier => {
      initial[tier.id] = false;
    });
    setSelectedTiers(initial);
  }, [tiers]);

  const getTierCurriculum = (tierId: string): string => {
    if (usePerTierCurriculum && tierCurriculum[tierId]) {
      return tierCurriculum[tierId];
    }
    return curriculum;
  };

  const getTotalSubjects = (tier: Tier) => {
    const tierCurr = getTierCurriculum(tier.id);
    const levels = getTierLevels(tier.code);
    let total = 0;
    for (const level of levels) {
      const subjects = getSubjectsByCurriculum(level, tierCurr);
      total += subjects.length;
    }
    return total;
  };

  const toggleTier = (tierId: string) => {
    setSelectedTiers(prev => ({ ...prev, [tierId]: !prev[tierId] }));
  };

  const handleContinue = () => {
    const tierLevels: { tierId: string; level: number }[] = [];
    
    Object.entries(selectedTiers).forEach(([tierId, isSelected]) => {
      if (isSelected) {
        const tier = tiers.find(t => t.id === tierId);
        if (tier) {
          const levels = getTierLevels(tier.code);
          levels.forEach(level => {
            tierLevels.push({ tierId, level });
          });
        }
      }
    });
    
    onAddSubjects(tierLevels);
  };

  const getSelectedCount = () => {
    return Object.values(selectedTiers).filter(Boolean).length;
  };

  const getTotalSubjectCount = () => {
    let total = 0;
    tiers.forEach(tier => {
      if (selectedTiers[tier.id]) {
        total += getTotalSubjects(tier);
      }
    });
    return total;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Auto-Create Subjects</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Select tiers to automatically create ALL subjects based on curriculum
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tiers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No tiers found. Please complete Step 1 first.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier) => {
              const tierCurr = getTierCurriculum(tier.id);
              const tierCurriculumName = CURRICULUM_INFO[tierCurr as keyof typeof CURRICULUM_INFO]?.name || tierCurr;
              const levels = getTierLevels(tier.code);
              const totalSubjects = getTotalSubjects(tier);
              const isSelected = selectedTiers[tier.id];
              
              return (
                <button
                  key={tier.id}
                  onClick={() => toggleTier(tier.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium dark:text-white">{tier.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Curriculum: {tierCurriculumName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold dark:text-white">{levels.length}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">class levels</div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {totalSubjects} subjects
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Will add subjects for: {levels.map(l => {
                      const names = ['', 'Creche', 'Pre-Nursery', 'Nursery 1', 'Nursery 2', 'Nursery 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];
                      return names[l] || `Level ${l}`;
                    }).join(', ')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 mt-6 pt-6 border-t dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={submitting || getSelectedCount() === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Add {getSelectedCount()} Tier(s) • {getTotalSubjectCount()} Subjects
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
