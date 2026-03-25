'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';

interface SchoolSettings {
  schoolName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  dateFormat: string;
  gradingScale: string;
  currency: string;
  logo?: string;
  brandColor?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    gradingScale: 'nigerian',
    currency: 'NGN',
    logo: '',
    brandColor: '#1a56db',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/school/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...(data.settings || {}) }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/school/settings', {
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
  };

  const colorPresets = [
    '#1a56db', '#059669', '#7c3aed', '#dc2626', '#ea580c', 
    '#0891b2', '#4f46e5', '#be185d', '#854d0e', '#1f2937'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="text-gray-500 mt-1">Configure your school preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium">Changes saved!</span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Main details about your school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">School Name</label>
              <Input
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                placeholder="Enter school name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="school@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+234..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="School address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
            <CardDescription>Timezone and date format preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <Select 
                value={settings.timezone} 
                onValueChange={(v) => setSettings({ ...settings, timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                  <SelectItem value="Africa/Abuja">Africa/Abuja (GMT+1)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Format</label>
              <Select 
                value={settings.dateFormat} 
                onValueChange={(v) => setSettings({ ...settings, dateFormat: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <Select 
                value={settings.currency} 
                onValueChange={(v) => setSettings({ ...settings, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GHS">Ghana Cedis (₵)</SelectItem>
                  <SelectItem value="KES">Kenya Shilling (KSh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grading Scale</label>
              <Select 
                value={settings.gradingScale} 
                onValueChange={(v) => setSettings({ ...settings, gradingScale: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nigerian">Nigerian Standard (NERDC)</SelectItem>
                  <SelectItem value="5point">5-Point Scale</SelectItem>
                  <SelectItem value="7point">7-Point Scale</SelectItem>
                  <SelectItem value="percentage">Percentage (0-100)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize your school appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand Color</label>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSettings({ ...settings, brandColor: color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      settings.brandColor === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.brandColor || '#1a56db'}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="w-8 h-8 rounded-full border-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="pt-4">
              <p className="text-sm text-gray-500">Brand Preview</p>
              <div 
                className="mt-2 w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: settings.brandColor || '#1a56db' }}
              >
                {settings.schoolName?.charAt(0) || 'S'}
              </div>
              <p className="mt-2 font-medium">{settings.schoolName || 'School Name'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
