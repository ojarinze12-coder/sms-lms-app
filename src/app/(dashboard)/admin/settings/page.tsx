'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBrand } from '@/components/brand-theme-provider';
import { useTheme } from 'next-themes';
import { 
  Settings,
  Building2,
  Palette,
  Bell,
  Shield,
  Save,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Upload,
  X
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { branding, updateBranding } = useBrand();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [settings, setSettings] = useState({
    platformName: 'Edunext',
    supportEmail: 'support@edunext.com',
    defaultPlan: 'FREE',
    allowRegistration: true,
    aiFeaturesEnabled: true,
    brandColor: '#1a56db',
    themeMode: 'system',
    logo: '',
  });

  useEffect(() => {
    if (branding.brandColor) {
      setSettings(prev => ({ ...prev, brandColor: branding.brandColor }));
    }
  }, [branding]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let logoUrl = settings.logo;
      
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.url || uploadData.path;
        }
      }
      
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: settings.platformName,
          supportEmail: settings.supportEmail,
          defaultPlan: settings.defaultPlan,
          allowRegistration: settings.allowRegistration,
          aiFeaturesEnabled: settings.aiFeaturesEnabled,
          brandColor: settings.brandColor,
          themeMode: settings.themeMode,
          logo: logoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
        setSaving(false);
        return;
      }
      
      updateBranding({ 
        brandColor: settings.brandColor,
        logo: logoUrl || null,
        name: settings.platformName,
      });
      setTheme(settings.themeMode);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setSettings(prev => ({ ...prev, themeMode: newTheme }));
    setTheme(newTheme);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, logo: '' }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure platform-wide settings and preferences</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Building2 className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Basic platform information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Platform Name
            </label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Plan for New Schools
            </label>
            <select
              value={settings.defaultPlan}
              onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Palette className="h-5 w-5" />
            Platform Branding
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Default brand settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform Logo
            </label>
            <div className="flex items-center gap-4">
              {(logoPreview || settings.logo) ? (
                <div className="relative">
                  <img 
                    src={logoPreview || settings.logo} 
                    alt="Platform Logo" 
                    className="w-20 h-20 object-contain rounded-lg border dark:border-gray-600"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brandColor}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="w-12 h-12 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.brandColor}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme Mode
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  settings.themeMode === 'light' || (settings.themeMode === 'system' && theme === 'light')
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  settings.themeMode === 'dark' || (settings.themeMode === 'system' && theme === 'dark')
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  settings.themeMode === 'system'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Monitor className="h-4 w-4" />
                System
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Shield className="h-5 w-5" />
            Platform Features
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div>
              <div className="font-medium dark:text-white">Allow School Registration</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Let new schools register on the platform</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowRegistration ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div>
              <div className="font-medium dark:text-white">AI Features</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Enable AI-powered timetable and exam generation</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, aiFeaturesEnabled: !settings.aiFeaturesEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.aiFeaturesEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.aiFeaturesEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end items-center gap-4">
        {saved && (
          <span className="text-green-600 dark:text-green-400 text-sm font-medium">Settings saved successfully!</span>
        )}
        {error && (
          <span className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
