'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Settings } from 'lucide-react';

interface DocumentSettings {
  documentsEnabled: boolean;
  requireDocuments: boolean;
  requiredDocumentTypes: string[];
}

export default function DocumentSettingsPage() {
  const [settings, setSettings] = useState<DocumentSettings>({
    documentsEnabled: true,
    requireDocuments: false,
    requiredDocumentTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await authFetch('/api/tenant/settings');
      const data = await res.json();
      setSettings({
        documentsEnabled: data.documentsEnabled ?? true,
        requireDocuments: data.requireDocuments ?? false,
        requiredDocumentTypes: data.requiredDocumentTypes ?? []
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await authFetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentsEnabled: settings.documentsEnabled,
          requireDocuments: settings.requireDocuments,
          requiredDocumentTypes: settings.requiredDocumentTypes
        })
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }

  const documentTypes = [
    { value: 'PROFILE_PHOTO', label: 'Profile Photo' },
    { value: 'BIRTH_CERT', label: 'Birth Certificate' },
    { value: 'PREVIOUS_RESULT', label: 'Previous Result' },
    { value: 'MEDICAL_RECORD', label: 'Medical Record' },
    { value: 'IMMUNIZATION', label: 'Immunization Record' },
    { value: 'ID_CARD', label: 'ID Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'TRANSFER_CERT', label: 'Transfer Certificate' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Settings</h1>
          <p className="text-gray-500 mt-1">Configure document management requirements</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Document Management</Label>
                <p className="text-sm text-gray-500">Allow uploading and managing documents</p>
              </div>
              <Switch
                checked={settings.documentsEnabled}
                onCheckedChange={(checked) => setSettings({...settings, documentsEnabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Require Documents</Label>
                <p className="text-sm text-gray-500">Make document uploads mandatory for students</p>
              </div>
              <Switch
                checked={settings.requireDocuments}
                onCheckedChange={(checked) => setSettings({...settings, requireDocuments: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {settings.requireDocuments && (
          <Card>
            <CardHeader>
              <CardTitle>Required Document Types</CardTitle>
              <p className="text-sm text-gray-500">Select which documents are required</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {documentTypes.map(type => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      settings.requiredDocumentTypes.includes(type.value) ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.requiredDocumentTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            requiredDocumentTypes: [...settings.requiredDocumentTypes, type.value]
                          });
                        } else {
                          setSettings({
                            ...settings,
                            requiredDocumentTypes: settings.requiredDocumentTypes.filter(t => t !== type.value)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/sms/documents'}>
                View All Documents
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/sms/applications/settings'}>
                Application Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}