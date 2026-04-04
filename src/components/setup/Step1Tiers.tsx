'use client';

import { useState } from 'react';
import { Loader2, ArrowRight, Building2 } from 'lucide-react';
import { TIER_TEMPLATE_OPTIONS } from '@/lib/constants/tiers';
import type { TierWithCount } from '@/types/setup';

interface Step1TiersProps {
  existingTiers: TierWithCount[];
  selectedTemplate: string;
  submitting: boolean;
  onTemplateChange: (template: string) => void;
  onApplyTemplate: () => void;
  onContinue: () => void;
}

export default function Step1Tiers({
  existingTiers,
  selectedTemplate,
  submitting,
  onTemplateChange,
  onApplyTemplate,
  onContinue,
}: Step1TiersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">School Tiers</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {existingTiers.length > 0
              ? `You have ${existingTiers.length} tiers configured`
              : 'Select a template to set up your school tiers'}
          </p>
        </div>
      </div>

      {existingTiers.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-medium mb-3 dark:text-white">Current Tiers:</h3>
          <div className="flex flex-wrap gap-2">
            {existingTiers.map((tier) => (
              <span
                key={tier.id}
                className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2"
              >
                {tier.name}
                <span className="text-blue-400">({tier._count?.classes || 0} classes)</span>
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Tiers already configured. You can add more tiers manually or continue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select a template that matches your school structure:
          </p>
          {TIER_TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onTemplateChange(option.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedTemplate === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium dark:text-white">{option.label}</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-gray-700">
        {existingTiers.length === 0 && (
          <button
            onClick={onApplyTemplate}
            disabled={!selectedTemplate || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply Template
          </button>
        )}
        {existingTiers.length > 0 && (
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
