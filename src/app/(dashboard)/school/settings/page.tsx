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
import { Upload, X, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { useBrand } from '@/components/brand-theme-provider';
import { useTheme } from 'next-themes';

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
  themeMode?: string;
}

export default function SettingsPage() {
  const { branding, updateBranding } = useBrand();
  const { theme, setTheme } = useTheme();
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
    themeMode: 'SYSTEM',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (branding.brandColor) {
      setSettings(prev => ({ ...prev, brandColor: branding.brandColor }));
    }
  }, [branding]);

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
    setError(null);
    try {
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        updateBranding({
          name: settings.schoolName,
          logo: settings.logo || null,
          brandColor: settings.brandColor,
        });
        if (settings.themeMode) {
          setTheme(settings.themeMode.toLowerCase());
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else if (res.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your school preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">Changes saved!</span>
          )}
          {error && (
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</span>
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
              <label className="block text-sm font-medium mb-2">School Logo</label>
              <div className="flex items-center gap-4">
                {settings.logo ? (
                  <div className="relative">
                    <img 
                      src={settings.logo} 
                      alt="School logo" 
                      className="w-20 h-20 object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logo: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    value={settings.logo || ''}
                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                    placeholder="Enter logo URL or paste image address"
                    className="w-64"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a URL for your school logo
                  </p>
                </div>
              </div>
            </div>
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
              <div className="flex items-center gap-4 mt-2">
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt="Logo preview" 
                    className="w-16 h-16 object-contain rounded-lg border"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: settings.brandColor || '#1a56db' }}
                  >
                    {settings.schoolName?.charAt(0) || 'S'}
                  </div>
                )}
                <p className="font-medium">{settings.schoolName || 'School Name'}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium mb-2">Theme Mode</label>
              <p className="text-sm text-gray-500 mb-3">Choose how the app appearance adapts</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, themeMode: 'LIGHT' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    settings.themeMode === 'LIGHT' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, themeMode: 'DARK' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    settings.themeMode === 'DARK' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, themeMode: 'SYSTEM' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    settings.themeMode === 'SYSTEM' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
