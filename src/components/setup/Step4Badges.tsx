'use client';

import { Loader2, ArrowLeft, Award } from 'lucide-react';

interface Step4BadgesProps {
  badgesEnabled: boolean;
  badgesAutoAward: boolean;
  badgesShowOnReport: boolean;
  submitting: boolean;
  onBadgesEnabledChange: (enabled: boolean) => void;
  onBadgesAutoAwardChange: (auto: boolean) => void;
  onBadgesShowOnReportChange: (show: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

export default function Step4Badges({
  badgesEnabled,
  badgesAutoAward,
  badgesShowOnReport,
  submitting,
  onBadgesEnabledChange,
  onBadgesAutoAwardChange,
  onBadgesShowOnReportChange,
  onSave,
  onBack,
}: Step4BadgesProps) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <Award className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Badge & Achievement System</h2>
          <p className="text-gray-600 text-sm">
            Configure how students earn and display badges
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Badges are awards that students can earn for achievements, participation, and excellence. 
            You can configure whether badges are automatically awarded or require manual approval.
          </p>
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
            <input
              type="checkbox"
              checked={badgesEnabled}
              onChange={(e) => onBadgesEnabledChange(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-700">Enable Badge System</div>
              <div className="text-sm text-gray-500">
                Allow students to earn and collect badges for achievements
              </div>
            </div>
          </label>
        </div>

        {badgesEnabled && (
          <>
            <div>
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
                <input
                  type="checkbox"
                  checked={badgesAutoAward}
                  onChange={(e) => onBadgesAutoAwardChange(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-700">Auto Award Badges</div>
                  <div className="text-sm text-gray-500">
                    Automatically award badges based on defined rules (e.g., perfect attendance, high scores)
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
                <input
                  type="checkbox"
                  checked={badgesShowOnReport}
                  onChange={(e) => onBadgesShowOnReportChange(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-700">Show Badges on Report Cards</div>
                  <div className="text-sm text-gray-500">
                    Display earned badges on student report cards
                  </div>
                </div>
              </label>
            </div>
          </>
        )}
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & Complete
        </button>
      </div>
    </div>
  );
}
