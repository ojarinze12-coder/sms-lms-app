'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { authFetch } from '@/lib/auth-fetch';

interface ExamSettings {
  examTimeLimit: number;
  passingScore: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
}

export default function LMSSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    examTimeLimit: 60,
    passingScore: 50,
    allowLateSubmission: true,
    latePenaltyPercent: 10,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/lms/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setExamSettings({
            examTimeLimit: data.examTimeLimit ?? 60,
            passingScore: data.passingScore ?? 50,
            allowLateSubmission: data.allowLateSubmission ?? true,
            latePenaltyPercent: data.latePenaltyPercent ?? 10,
          });
        }
      }
    } catch {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/lms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examSettings),
      });

      if (res.ok) {
        toast({ description: 'Exam & Assignment settings saved successfully' });
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to save settings' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">LMS Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure Learning Management System preferences</p>
      </div>

      {/* Exam & Assignment Settings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exam & Assignment Defaults
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Configure default settings for exams and assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Default Time Limit (minutes)</label>
                  <Input
                    type="number"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={examSettings.examTimeLimit}
                    onChange={(e) => setExamSettings({ ...examSettings, examTimeLimit: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Passing Score (%)</label>
                  <Input
                    type="number"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={examSettings.passingScore}
                    onChange={(e) => setExamSettings({ ...examSettings, passingScore: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium dark:text-white">Allow Late Submission</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Students can submit after deadline</p>
                </div>
                <button
                  onClick={() => setExamSettings({ ...examSettings, allowLateSubmission: !examSettings.allowLateSubmission })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    examSettings.allowLateSubmission ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      examSettings.allowLateSubmission ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {examSettings.allowLateSubmission && (
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Late Penalty (% per day)</label>
                  <Input
                    type="number"
                    className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={examSettings.latePenaltyPercent}
                    onChange={(e) => setExamSettings({ ...examSettings, latePenaltyPercent: parseInt(e.target.value) || 10 })}
                  />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
