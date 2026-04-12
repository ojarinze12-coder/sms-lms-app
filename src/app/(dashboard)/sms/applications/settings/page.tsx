'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Check, Users } from 'lucide-react';

interface ApplicationSettings {
  applicationsEnabled: boolean;
  applicationFee: number;
  applicationPaymentGateway: string | null;
  requireEntranceExam: boolean;
  entranceExamThreshold: number;
  requireInterview: boolean;
  requireDocuments: boolean;
  requiredDocumentTypes: string[];
  autoEnrollClasses: string[];
  applicationDeadline: string | null;
  allowParentRegistration: boolean;
  sendWelcomeEmail: boolean;
  tierRequirements: Record<string, {
    requireEntranceExam: boolean;
    requireInterview: boolean;
    requireDocuments: boolean;
    requiredDocumentTypes: string[];
    minAge?: number;
    maxAge?: number;
  }>;
  tiers: { id: string; name: string; level: number }[];
}

export default function ApplicationSettingsPage() {
  const [settings, setSettings] = useState<ApplicationSettings>({
    applicationsEnabled: false,
    applicationFee: 0,
    applicationPaymentGateway: null,
    requireEntranceExam: false,
    entranceExamThreshold: 50,
    requireInterview: false,
    requireDocuments: false,
    requiredDocumentTypes: [],
    autoEnrollClasses: [],
    applicationDeadline: null,
    allowParentRegistration: true,
    sendWelcomeEmail: true,
    tierRequirements: {},
    tiers: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const [settingsRes, tiersRes] = await Promise.all([
        authFetch('/api/sms/applications/settings'),
        authFetch('/api/sms/tiers')
      ]);
      
      const settingsData = settingsRes.ok ? await settingsRes.json() : {};
      const tiersData = await tiersRes.json();
      
      setSettings({
        ...settingsData,
        tiers: tiersData || [],
        tierRequirements: settingsData.tierRequirements || {},
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        applicationsEnabled: settings.applicationsEnabled,
        applicationFee: settings.applicationFee,
        applicationPaymentGateway: settings.applicationPaymentGateway,
        requireEntranceExam: settings.requireEntranceExam,
        entranceExamThreshold: settings.entranceExamThreshold,
        requireInterview: settings.requireInterview,
        requireDocuments: settings.requireDocuments,
        requiredDocumentTypes: settings.requiredDocumentTypes,
        autoEnrollClasses: settings.autoEnrollClasses,
        applicationDeadline: settings.applicationDeadline,
        allowParentRegistration: settings.allowParentRegistration,
        sendWelcomeEmail: settings.sendWelcomeEmail,
      };
      
      console.log('Saving:', payload);
      
      const res = await authFetch('/api/sms/applications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  }

  const documentTypes = [
    { id: 'BIRTH_CERT', label: 'Birth Certificate' },
    { id: 'PREVIOUS_RESULT', label: 'Previous School Result' },
    { id: 'MEDICAL', label: 'Medical Record' },
    { id: 'TRANSFER_CERT', label: 'Transfer Certificate' },
  ];

  function toggleDocumentType(type: string) {
    setSettings(prev => ({
      ...prev,
      requiredDocumentTypes: prev.requiredDocumentTypes.includes(type)
        ? prev.requiredDocumentTypes.filter(t => t !== type)
        : [...prev.requiredDocumentTypes, type],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Settings</h1>
          <p className="text-gray-600">Configure online admission settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Enable or disable online applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Online Applications</Label>
              <p className="text-sm text-gray-500">Allow prospective students to apply online</p>
            </div>
            <Switch
              checked={settings.applicationsEnabled}
              onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, applicationsEnabled: checked }))}
            />
          </div>

          {settings.applicationsEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <Label>Application Fee (₦)</Label>
                  <Input
                    type="number"
                    value={settings.applicationFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, applicationFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0 for free"
                  />
                </div>
                <div>
                  <Label>Payment Gateway</Label>
                  <Select
                    value={settings.applicationPaymentGateway || 'NONE'}
                    onValueChange={(v) => setSettings(prev => ({ ...prev, applicationPaymentGateway: v === 'NONE' ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None (Free)</SelectItem>
                      <SelectItem value="PAYSTACK">Paystack</SelectItem>
                      <SelectItem value="FLUTTERWAVE">Flutterwave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Application Deadline</Label>
                <Input
                  type="date"
                  value={settings.applicationDeadline || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, applicationDeadline: e.target.value || null }))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.applicationsEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Admission Workflow</CardTitle>
              <CardDescription>Configure the admission process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Entrance Exam</Label>
                  <p className="text-sm text-gray-500">Applicants must pass entrance exam</p>
                </div>
                <Switch
                  checked={settings.requireEntranceExam}
                  onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, requireEntranceExam: checked }))}
                />
              </div>

              {settings.requireEntranceExam && (
                <div className="ml-6">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={settings.entranceExamThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, entranceExamThreshold: parseFloat(e.target.value) || 50 }))}
                    className="w-32"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Interview</Label>
                  <p className="text-sm text-gray-500">Applicants must attend interview</p>
                </div>
                <Switch
                  checked={settings.requireInterview}
                  onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, requireInterview: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Documents</Label>
                  <p className="text-sm text-gray-500">Applicants must upload required documents</p>
                </div>
                <Switch
                  checked={settings.requireDocuments}
                  onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, requireDocuments: checked }))}
                />
              </div>

              {settings.requireDocuments && (
                <div className="ml-6 space-y-2">
                  <Label>Required Document Types</Label>
                  <div className="flex flex-wrap gap-4">
                    {documentTypes.map(type => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={settings.requiredDocumentTypes.includes(type.id)}
                          onCheckedChange={() => toggleDocumentType(type.id)}
                        />
                        <Label htmlFor={type.id} className="font-normal">{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post-Enrollment Options</CardTitle>
              <CardDescription>Configure what happens after enrollment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Allow Parent Self-Registration</Label>
                  <p className="text-sm text-gray-500">Create parent account during application</p>
                </div>
                <Switch
                  checked={settings.allowParentRegistration}
                  onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, allowParentRegistration: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Send Welcome Email</Label>
                  <p className="text-sm text-gray-500">Send login credentials to parent/guardian</p>
                </div>
                <Switch
                  checked={settings.sendWelcomeEmail}
                  onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, sendWelcomeEmail: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public Application Link</CardTitle>
              <CardDescription>Share this link with prospective students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/apply?school=demo-school` : '/apply?school=demo-school'}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Replace <code>demo-school</code> with your school&apos;s slug
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}