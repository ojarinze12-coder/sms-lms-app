'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import type { Curriculum } from '@prisma/client';
import type { TierWithCount, DepartmentWithCount, TierCurriculum } from '@/types/setup';
import type { TenantSettings } from '@/types';
import Step1Tiers from '@/components/setup/Step1Tiers';
import Step2Curriculum from '@/components/setup/Step2Curriculum';
import Step3Departments from '@/components/setup/Step3Departments';
import Step3Subjects from '@/components/setup/Step3Subjects';
import Step4Badges from '@/components/setup/Step4Badges';
import Step5Complete from '@/components/setup/Step5Complete';

export default function SchoolSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [existingTiers, setExistingTiers] = useState<TierWithCount[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<DepartmentWithCount[]>([]);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [curriculum, setCurriculum] = useState<Curriculum>('NERDC');
  const [usePerTierCurriculum, setUsePerTierCurriculum] = useState(false);
  const [tierCurriculum, setTierCurriculum] = useState<Record<string, Curriculum>>({});
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['SCI', 'COM', 'ART']);

  const [badgesEnabled, setBadgesEnabled] = useState(true);
  const [badgesAutoAward, setBadgesAutoAward] = useState(false);
  const [badgesShowOnReport, setBadgesShowOnReport] = useState(true);

  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [periodDuration, setPeriodDuration] = useState(40);
  const [schoolStartTime, setSchoolStartTime] = useState("08:00");
  const [schoolEndTime, setSchoolEndTime] = useState("15:00");
  const [breakStartTime, setBreakStartTime] = useState("12:00");
  const [breakEndTime, setBreakEndTime] = useState("12:30");

  // Subjects creation result
  const [subjectsCreated, setSubjectsCreated] = useState<number>(0);
  const [classesCreated, setClassesCreated] = useState<number>(0);

  const TOTAL_STEPS = 6;

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const [tiersRes, deptsRes, settingsRes, badgeRes] = await Promise.all([
        authFetch('/api/sms/tiers'),
        authFetch('/api/sms/departments'),
        authFetch('/api/tenant/curriculum'),
        authFetch('/api/tenant/badge-settings').catch(() => ({ ok: false, json: () => ({}) }))
      ]);

      const [tiersData, deptsData, settingsData, badgeData] = await Promise.all([
        tiersRes.ok ? tiersRes.json() : { data: [] },
        deptsRes.ok ? deptsRes.json() : { data: [] },
        settingsRes.ok ? settingsRes.json() : { data: {} },
        badgeRes.ok ? badgeRes.json() : {}
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
      const res = await authFetch('/api/sms/tiers', {
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
      const res = await authFetch('/api/tenant/curriculum', {
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

    if (existingDepartments.length > 0) {
      setStep(4);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/sms/departments', {
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

  const handleAddSubjects = async (tierLevels: { tierId: string; level: number }[]) => {
    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/sms/subjects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierLevels }),
      });

      const data = await res.json();
      console.log('[SETUP] Subjects bulk result:', JSON.stringify(data, null, 2));

      if (!res.ok) {
        setError(data.error || 'Failed to create subjects');
        alert('Error: ' + JSON.stringify(data));
        return;
      }

      // Show detailed result in alert for debugging
      alert(`Debug Info:\n` +
        `Total Subjects Created: ${data.totalCreated}\n` +
        `Tier Levels Processed: ${data.totalProcessed}\n` +
        `Debug: ${JSON.stringify(data.debug, null, 2)}`
      );

      // Store the results - totalCreated is actual subjects, calculate classes from results
      setSubjectsCreated(data.totalCreated || 0);
      setClassesCreated(data.results?.reduce((sum: number, r: any) => sum + (r.created > 0 ? 1 : 0), 0) || 0);

      setStep(5);
    } catch (err) {
      setError('An error occurred: ' + err);
      alert('Exception: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBadgeSettings = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/tenant/badge-settings', {
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

      setStep(6);
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
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-4">
        <Link href="/sms/tiers" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Tiers
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">School Setup Wizard</h1>
      </div>

      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 py-3 border-b dark:border-gray-700 mb-4">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {[
            { num: 1, label: 'Tiers' },
            { num: 2, label: 'Curriculum' },
            { num: 3, label: 'Departments' },
            { num: 4, label: 'Subjects' },
            { num: 5, label: 'Badges' },
            { num: 6, label: 'Complete' },
          ].map((s) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`ml-1 text-xs hidden sm:inline ${step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {s.label}
              </span>
              {s.num < TOTAL_STEPS && (
                <div className={`w-6 h-0.5 mx-1 rounded ${step > s.num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

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

      {step === 4 && (
        <Step3Subjects
          tiers={existingTiers.map(t => ({ id: t.id, name: t.name, code: t.code }))}
          curriculum={curriculum}
          usePerTierCurriculum={usePerTierCurriculum}
          tierCurriculum={tierCurriculum}
          submitting={submitting}
          onAddSubjects={handleAddSubjects}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && (
        <Step4Badges
          badgesEnabled={badgesEnabled}
          badgesAutoAward={badgesAutoAward}
          badgesShowOnReport={badgesShowOnReport}
          submitting={submitting}
          onBadgesEnabledChange={setBadgesEnabled}
          onBadgesAutoAwardChange={setBadgesAutoAward}
          onBadgesShowOnReportChange={setBadgesShowOnReport}
          onSave={handleSaveBadgeSettings}
          onBack={() => setStep(4)}
        />
      )}

      {step === 6 && (
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
          subjectsCreated={subjectsCreated}
          classesCreated={classesCreated}
        />
      )}
    </div>
  );
}
