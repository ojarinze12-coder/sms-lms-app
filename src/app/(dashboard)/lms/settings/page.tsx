'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  BookOpen,
  Award,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  Save
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function LMSSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enableGamification: true,
    enableCertificates: true,
    enableBadges: true,
    enableLeaderboards: true,
    defaultCourseVisibility: 'PUBLISHED',
    defaultEnrollmentType: 'OPEN',
    examTimeLimit: 60,
    passingScore: 50,
    allowLateSubmission: true,
    latePenaltyPercent: 10,
    enableDiscussionForums: true,
    requireApprovalForEnrollment: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/lms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({ description: 'LMS settings saved successfully' });
      } else {
        toast({ variant: 'destructive', description: 'Failed to save settings' });
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
        <h1 className="text-2xl font-bold">LMS Settings</h1>
        <p className="text-gray-600">Configure Learning Management System preferences</p>
      </div>

      {/* Course Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Settings
          </CardTitle>
          <CardDescription>Default settings for courses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Course Visibility</label>
              <select
                value={settings.defaultCourseVisibility}
                onChange={(e) => setSettings({ ...settings, defaultCourseVisibility: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Enrollment Type</label>
              <select
                value={settings.defaultEnrollmentType}
                onChange={(e) => setSettings({ ...settings, defaultEnrollmentType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="OPEN">Open Enrollment</option>
                <option value="INVITE_ONLY">Invite Only</option>
                <option value="APPROVAL_REQUIRED">Approval Required</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Require Approval for Enrollment</p>
              <p className="text-sm text-gray-500">Students need teacher approval to enroll</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, requireApprovalForEnrollment: !settings.requireApprovalForEnrollment })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.requireApprovalForEnrollment ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.requireApprovalForEnrollment ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Exam Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exam Settings
          </CardTitle>
          <CardDescription>Configure exam and assessment defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Time Limit (minutes)</label>
              <Input
                type="number"
                value={settings.examTimeLimit}
                onChange={(e) => setSettings({ ...settings, examTimeLimit: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
              <Input
                type="number"
                value={settings.passingScore}
                onChange={(e) => setSettings({ ...settings, passingScore: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Allow Late Submission</p>
              <p className="text-sm text-gray-500">Students can submit after deadline</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowLateSubmission: !settings.allowLateSubmission })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowLateSubmission ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allowLateSubmission ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.allowLateSubmission && (
            <div>
              <label className="block text-sm font-medium mb-2">Late Penalty (% per day)</label>
              <Input
                type="number"
                value={settings.latePenaltyPercent}
                onChange={(e) => setSettings({ ...settings, latePenaltyPercent: parseInt(e.target.value) })}
                className="w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gamification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Gamification
          </CardTitle>
          <CardDescription>Enable badges, certificates, and rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable Certificates</p>
              <p className="text-sm text-gray-500">Students can earn course completion certificates</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableCertificates: !settings.enableCertificates })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableCertificates ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableCertificates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable Badges</p>
              <p className="text-sm text-gray-500">Students can earn achievement badges</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableBadges: !settings.enableBadges })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableBadges ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableBadges ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable Leaderboards</p>
              <p className="text-sm text-gray-500">Display student rankings</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableLeaderboards: !settings.enableLeaderboards })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableLeaderboards ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableLeaderboards ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Discussion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Communication
          </CardTitle>
          <CardDescription>Configure discussion and communication features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable Discussion Forums</p>
              <p className="text-sm text-gray-500">Students can discuss course content</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableDiscussionForums: !settings.enableDiscussionForums })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableDiscussionForums ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableDiscussionForums ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
