'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Check } from 'lucide-react';

interface HostelSettings {
  hostelEnabled: boolean;
  hostelTypesAllowed: string[];
  hostelDefaultRoomType: string;
  hostelDefaultCapacity: number;
  hostelAutoAssign: boolean;
  hostelRequireApproval: boolean;
  hostelChargeFee: boolean;
  hostelCheckInOut: boolean;
}

export default function HostelSettingsPage() {
  const [settings, setSettings] = useState<HostelSettings>({
    hostelEnabled: false,
    hostelTypesAllowed: ['MALE', 'FEMALE'],
    hostelDefaultRoomType: 'DORMITORY',
    hostelDefaultCapacity: 4,
    hostelAutoAssign: true,
    hostelRequireApproval: false,
    hostelChargeFee: false,
    hostelCheckInOut: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/sms/hostels/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/sms/hostels/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }

  function toggleType(type: string) {
    setSettings(prev => ({
      ...prev,
      hostelTypesAllowed: prev.hostelTypesAllowed.includes(type)
        ? prev.hostelTypesAllowed.filter(t => t !== type)
        : [...prev.hostelTypesAllowed, type],
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hostel Settings</h1>
          <p className="text-gray-600">Configure hostel management options</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Enable or disable hostel module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Hostel Module</Label>
              <p className="text-sm text-gray-500">Allow hostel management for this school</p>
            </div>
            <Switch
              checked={settings.hostelEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hostelEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {settings.hostelEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Hostel Configuration</CardTitle>
              <CardDescription>Set default options for new hostels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Allowed Hostel Types</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.hostelTypesAllowed.includes('MALE')}
                      onCheckedChange={() => toggleType('MALE')}
                    />
                    <Label className="font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.hostelTypesAllowed.includes('FEMALE')}
                      onCheckedChange={() => toggleType('FEMALE')}
                    />
                    <Label className="font-normal">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.hostelTypesAllowed.includes('MIXED')}
                      onCheckedChange={() => toggleType('MIXED')}
                    />
                    <Label className="font-normal">Mixed</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Room Type</Label>
                  <Select
                    value={settings.hostelDefaultRoomType}
                    onValueChange={(v) => setSettings(prev => ({ ...prev, hostelDefaultRoomType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DORMITORY">Dormitory</SelectItem>
                      <SelectItem value="BUNK">Bunk</SelectItem>
                      <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Capacity</Label>
                  <Select
                    value={settings.hostelDefaultCapacity.toString()}
                    onValueChange={(v) => setSettings(prev => ({ ...prev, hostelDefaultCapacity: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 beds</SelectItem>
                      <SelectItem value="4">4 beds</SelectItem>
                      <SelectItem value="6">6 beds</SelectItem>
                      <SelectItem value="8">8 beds</SelectItem>
                      <SelectItem value="10">10 beds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation Settings</CardTitle>
              <CardDescription>Configure how bed allocations work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Auto-Assign Beds</Label>
                  <p className="text-sm text-gray-500">Automatically assign available beds to new allocations</p>
                </div>
                <Switch
                  checked={settings.hostelAutoAssign}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hostelAutoAssign: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Approval</Label>
                  <p className="text-sm text-gray-500">Admin approval needed for allocations</p>
                </div>
                <Switch
                  checked={settings.hostelRequireApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hostelRequireApproval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Charge Hostel Fee</Label>
                  <p className="text-sm text-gray-500">Include hostel charges in school fees</p>
                </div>
                <Switch
                  checked={settings.hostelChargeFee}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hostelChargeFee: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Check-in/Check-out</Label>
                  <p className="text-sm text-gray-500">Track student movement in/out of hostel</p>
                </div>
                <Switch
                  checked={settings.hostelCheckInOut}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hostelCheckInOut: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}