'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import type { Curriculum } from '@prisma/client';
import type { TierWithCount, DepartmentWithCount, TierCurriculum } from '@/types/setup';
import type { TenantSettings } from '@/types';
import Step1Tiers from '@/components/setup/Step1Tiers';
import Step2Curriculum from '@/components/setup/Step2Curriculum';
import Step3Departments from '@/components/setup/Step3Departments';
import Step4Badges from '@/components/setup/Step4Badges';
import Step5Complete from '@/components/setup/Step5Complete';

export default function SchoolSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Existing data
  const [existingTiers, setExistingTiers] = useState<TierWithCount[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<DepartmentWithCount[]>([]);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [curriculum, setCurriculum] = useState<Curriculum>('NERDC');
  const [usePerTierCurriculum, setUsePerTierCurriculum] = useState(false);
  const [tierCurriculum, setTierCurriculum] = useState<Record<string, Curriculum>>({});
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['SCI', 'COM', 'ART']);

  // Badge settings state
  const [badgesEnabled, setBadgesEnabled] = useState(true);
  const [badgesAutoAward, setBadgesAutoAward] = useState(false);
  const [badgesShowOnReport, setBadgesShowOnReport] = useState(true);

  // Timetable settings state
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [periodDuration, setPeriodDuration] = useState(40);
  const [schoolStartTime, setSchoolStartTime] = useState("08:00");
  const [schoolEndTime, setSchoolEndTime] = useState("15:00");
  const [breakStartTime, setBreakStartTime] = useState("12:00");
  const [breakEndTime, setBreakEndTime] = useState("12:30");

  const TOTAL_STEPS = 5;

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const [tiersRes, deptsRes, settingsRes, badgeRes] = await Promise.all([
        fetch('/api/sms/tiers'),
        fetch('/api/sms/departments'),
        fetch('/api/tenant/curriculum'),
        fetch('/api/tenant/badge-settings').catch(() => ({ json: () => ({}) }))
      ]);

      const [tiersData, deptsData, settingsData, badgeData] = await Promise.all([
        tiersRes.json(),
        deptsRes.json(),
        settingsRes.json(),
        badgeRes.json()
      ]);

      setExistingTiers(tiersData.data || []);
      setExistingDepartments(deptsData.data || []);

      if (settingsData.data?.settings) {
        setSettings(settingsData.data.settings);
        setCurriculum(settingsData.data.settings.curriculumType || 'NERDC');
        setUsePerTierCurriculum(settingsData.data.settings.usePerTierCurriculum || false);
        setDaysPerWeek(settingsData.data.settings.daysPerWeek || 5);
        setPeriodDuration(settingsData.data.settings.periodDuration || 40);
        setSchoolStartTime(settingsData.data.settings.schoolStartTime || "08:00");
        setSchoolEndTime(settingsData.data.settings.schoolEndTime || "15:00");
        setBreakStartTime(settingsData.data.settings.breakStartTime || "12:00");
        setBreakEndTime(settingsData.data.settings.breakEndTime || "12:30");
      }

      if (settingsData.data?.tierCurriculum) {
        const tc: Record<string, Curriculum> = {};
        settingsData.data.tierCurriculum.forEach((item: TierCurriculum) => {
          tc[item.tierId] = item.curriculum;
        });
        setTierCurriculum(tc);
      }

      const badgeSettings = badgeData as { badgesEnabled?: boolean; badgesAutoAward?: boolean; badgesShowOnReport?: boolean };
      if (badgeSettings && badgeSettings.badgesEnabled !== undefined) {
        setBadgesEnabled(badgeSettings.badgesEnabled);
        setBadgesAutoAward(badgeSettings.badgesAutoAward);
        setBadgesShowOnReport(badgeSettings.badgesShowOnReport);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sms/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, curriculum }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to apply template');
        return;
      }

      await loadExistingData();
      setStep(2);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCurriculum = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/tenant/curriculum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumType: curriculum,
          usePerTierCurriculum,
          daysPerWeek,
          periodDuration,
          schoolStartTime,
          schoolEndTime,
          breakStartTime,
          breakEndTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
        return;
      }

      if (usePerTierCurriculum) {
        for (const [tierId, curr] of Object.entries(tierCurriculum)) {
          await fetch(`/api/tenant/tier-curriculum/${tierId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tierId, curriculum: curr }),
          });
        }
      }

      setStep(3);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDepartments = async () => {
    const sssTier = existingTiers.find(t => t.code === 'SSS');
    if (!sssTier) {
      setError('SSS tier not found. Please create tiers first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sms/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applyDefaults: true,
          tierId: sssTier.id,
          selectedDepts,
          curriculum,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create departments');
        return;
      }

      await loadExistingData();
      setStep(4);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBadgeSettings = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/tenant/badge-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badgesEnabled,
          badgesAutoAward,
          badgesShowOnReport,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save badge settings');
        return;
      }

      setStep(5);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/sms/tiers" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Tiers
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">School Setup Wizard</h1>
        <p className="text-gray-600 mt-2">
          Configure your school tiers, curriculum, and departments
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { num: 1, label: 'Tiers' },
          { num: 2, label: 'Curriculum' },
          { num: 3, label: 'Departments' },
          { num: 4, label: 'Badges' },
          { num: 5, label: 'Complete' },
        ].map((s) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.num ? <Check className="h-5 w-5" /> : s.num}
            </div>
            <span className={`ml-2 text-sm ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>
              {s.label}
            </span>
            {s.num < TOTAL_STEPS && (
              <div className={`w-12 h-1 mx-3 rounded ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Tier Selection */}
      {step === 1 && (
        <Step1Tiers
          existingTiers={existingTiers}
          selectedTemplate={selectedTemplate}
          submitting={submitting}
          onTemplateChange={setSelectedTemplate}
          onApplyTemplate={handleApplyTemplate}
          onContinue={() => setStep(2)}
        />
      )}

      {/* Step 2: Curriculum Settings */}
      {step === 2 && (
        <Step2Curriculum
          existingTiers={existingTiers}
          curriculum={curriculum}
          usePerTierCurriculum={usePerTierCurriculum}
          tierCurriculum={tierCurriculum}
          daysPerWeek={daysPerWeek}
          periodDuration={periodDuration}
          schoolStartTime={schoolStartTime}
          schoolEndTime={schoolEndTime}
          breakStartTime={breakStartTime}
          breakEndTime={breakEndTime}
          submitting={submitting}
          onCurriculumChange={setCurriculum}
          onUsePerTierCurriculumChange={setUsePerTierCurriculum}
          onTierCurriculumChange={(id, curr) => setTierCurriculum({ ...tierCurriculum, [id]: curr })}
          onDaysPerWeekChange={setDaysPerWeek}
          onPeriodDurationChange={setPeriodDuration}
          onSchoolStartTimeChange={setSchoolStartTime}
          onSchoolEndTimeChange={setSchoolEndTime}
          onBreakStartTimeChange={setBreakStartTime}
          onBreakEndTimeChange={setBreakEndTime}
          onSave={handleSaveCurriculum}
          onBack={() => setStep(1)}
        />
      )}

      {/* Step 3: SSS Departments */}
      {step === 3 && (
        <Step3Departments
          existingDepartments={existingDepartments}
          selectedDepts={selectedDepts}
          submitting={submitting}
          onSelectedDeptsChange={setSelectedDepts}
          onSave={handleCreateDepartments}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4: Badge Settings */}
      {step === 4 && (
        <Step4Badges
          badgesEnabled={badgesEnabled}
          badgesAutoAward={badgesAutoAward}
          badgesShowOnReport={badgesShowOnReport}
          submitting={submitting}
          onBadgesEnabledChange={setBadgesEnabled}
          onBadgesAutoAwardChange={setBadgesAutoAward}
          onBadgesShowOnReportChange={setBadgesShowOnReport}
          onSave={handleSaveBadgeSettings}
          onBack={() => setStep(3)}
        />
      )}

      {/* Step 5: Complete */}
      {step === 5 && (
        <Step5Complete
          existingTiers={existingTiers}
          existingDepartments={existingDepartments}
          curriculum={curriculum}
          badgesEnabled={badgesEnabled}
          badgesAutoAward={badgesAutoAward}
          daysPerWeek={daysPerWeek}
          periodDuration={periodDuration}
          schoolStartTime={schoolStartTime}
          schoolEndTime={schoolEndTime}
          breakStartTime={breakStartTime}
          breakEndTime={breakEndTime}
        />
      )}
    </div>
  );
}
