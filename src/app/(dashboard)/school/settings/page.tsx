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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Loader2, Sun, Moon, Monitor, CreditCard, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { useBrand } from '@/components/brand-theme-provider';
import { useTheme } from 'next-themes';
import { authFetch } from '@/lib/auth-fetch';

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

interface PaymentSettings {
  paymentGatewayEnabled: boolean;
  paymentGateway: string;
  paymentGatewaySecretKey: string;
  paymentGatewayPublicKey: string;
  paymentGatewayWebhookSecret: string;
  paymentDemoMode: boolean;
  remitaEnabled: boolean;
  remitaMerchantId: string;
  remitaApiKey: string;
  remitaServiceTypeId: string;
  remitaEnvironment: string;
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
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paymentGatewayEnabled: false,
    paymentGateway: '',
    paymentGatewaySecretKey: '',
    paymentGatewayPublicKey: '',
    paymentGatewayWebhookSecret: '',
    paymentDemoMode: false,
    remitaEnabled: false,
    remitaMerchantId: '',
    remitaApiKey: '',
    remitaServiceTypeId: '',
    remitaEnvironment: 'DEMO',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
      const timestamp = Date.now();
      const [settingsRes, paymentRes] = await Promise.all([
        authFetch(`/api/school/settings?_t=${timestamp}`),
        authFetch(`/api/school/payment-gateways?_t=${timestamp}`)
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(prev => ({ ...prev, ...(data.settings || {}) }));
      }
      
      if (paymentRes.ok) {
        const payData = await paymentRes.json();
        setPaymentSettings(prev => ({ 
          ...prev, 
          ...payData,
          paymentGatewaySecretKey: '',
          remitaApiKey: '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/school/payment-gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      });

      const data = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save payment settings');
      }
    } catch (err) {
      console.error('Failed to save payment settings:', err);
      setError('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/school/settings', {
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setSettings(prev => ({ ...prev, logo: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

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
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
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
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your school preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                      <SelectItem value="Africa/Abuja">Africa/Abuja (GMT+1)</SelectItem>
                      <SelectItem value="Africa/Port Harcourt">Africa/Port Harcourt (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Format</label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
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
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">School Logo</label>
                  <div className="space-y-4">
                    {/* Logo Preview */}
                    {(settings.logo || logoPreview) && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border" />
                        ) : settings.logo ? (
                          <img src={settings.logo} alt="Current logo" className="w-16 h-16 object-contain rounded-lg border" />
                        ) : null}
                        <div>
                          <p className="font-medium text-sm">Current Logo</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSettings({ ...settings, logo: '' });
                              setLogoPreview(null);
                              setLogoFile(null);
                            }}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Remove logo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Upload from Device */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Upload from device
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                            <Upload className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-500">Choose file</span>
                          </div>
                        </div>
                      </div>

                      {/* Logo URL */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Or enter logo URL
                        </label>
                        <Input
                          value={settings.logo}
                          onChange={(e) => {
                            setSettings({ ...settings, logo: e.target.value });
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Color Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Brand Color</label>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Preset Colors */}
                    <div className="flex flex-wrap gap-2">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSettings({ ...settings, brandColor: color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            settings.brandColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Custom Color Picker */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.brandColor || '#1a56db'}
                        onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                        className="w-8 h-8 rounded-full border-0 cursor-pointer"
                      />
                      <Input
                        value={settings.brandColor || '#1a56db'}
                        onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                        className="w-24 h-8"
                        placeholder="#1a56db"
                      />
                    </div>
                  </div>
                </div>

                {/* Brand Preview */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Brand Preview</p>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {settings.logo || logoPreview ? (
                      <img 
                        src={logoPreview || settings.logo} 
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
                    <div>
                      <p className="font-medium">{settings.schoolName || 'School Name'}</p>
                      <p className="text-sm text-gray-500">{settings.email || 'school@example.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Theme Mode */}
                <div>
                  <label className="block text-sm font-medium mb-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-4">
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

            <div className="lg:col-span-2 flex justify-end gap-3">
              {saved && (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium self-center">Changes saved!</span>
              )}
              {error && (
                <span className="text-red-500 dark:text-red-400 text-sm font-medium self-center">{error}</span>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save General Settings'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      School Fees Payment Gateway
                    </CardTitle>
                    <CardDescription>Configure payment gateway for accepting school fees online</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentSettings.paymentGatewayEnabled ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <AlertCircle className="h-4 w-4" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={paymentSettings.paymentGatewayEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, paymentGatewayEnabled: checked })}
                    />
                    <div>
                      <p className="font-medium">Enable Online Payments</p>
                      <p className="text-sm text-gray-500">Allow parents to pay school fees online</p>
                    </div>
                  </div>
                </div>

                {paymentSettings.paymentGatewayEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={paymentSettings.paymentDemoMode}
                          onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, paymentDemoMode: checked })}
                        />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Demo/Test Mode</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">Use demo payments for testing</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Payment Gateway</label>
                        <Select
                          value={paymentSettings.paymentGateway}
                          onValueChange={(value) => setPaymentSettings({ ...paymentSettings, paymentGateway: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gateway" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PAYSTACK">Paystack</SelectItem>
                            <SelectItem value="FLUTTERWAVE">Flutterwave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {paymentSettings.paymentGateway && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {paymentSettings.paymentGateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} Public Key
                          </label>
                          <Input
                            value={paymentSettings.paymentGatewayPublicKey}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentGatewayPublicKey: e.target.value })}
                            placeholder="Enter public key"
                          />
                          <p className="text-xs text-gray-500 mt-1">Public key for client-side integration</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {paymentSettings.paymentGateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} Secret Key
                          </label>
                          <Input
                            type="password"
                            value={paymentSettings.paymentGatewaySecretKey}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentGatewaySecretKey: e.target.value })}
                            placeholder={paymentSettings.paymentGatewaySecretKey ? "••••••••••••" : "Enter secret key"}
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave empty to keep current key</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Webhook Secret (Optional)</label>
                          <Input
                            type="password"
                            value={paymentSettings.paymentGatewayWebhookSecret}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentGatewayWebhookSecret: e.target.value })}
                            placeholder="Enter webhook secret"
                          />
                          <p className="text-xs text-gray-500 mt-1">For verifying payment webhook callbacks</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Payroll Payment (Remita)
                    </CardTitle>
                    <CardDescription>Configure Remita for staff salary payments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentSettings.remitaEnabled ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <AlertCircle className="h-4 w-4" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={paymentSettings.remitaEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, remitaEnabled: checked })}
                    />
                    <div>
                      <p className="font-medium">Enable Remita Payroll</p>
                      <p className="text-sm text-gray-500">Process staff salaries via Remita</p>
                    </div>
                  </div>
                </div>

                {paymentSettings.remitaEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Environment</label>
                        <Select
                          value={paymentSettings.remitaEnvironment}
                          onValueChange={(value) => setPaymentSettings({ ...paymentSettings, remitaEnvironment: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEMO">Demo/Sandbox</SelectItem>
                            <SelectItem value="LIVE">Live/Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Merchant ID</label>
                        <Input
                          value={paymentSettings.remitaMerchantId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, remitaMerchantId: e.target.value })}
                          placeholder="Enter merchant ID"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Service Type ID</label>
                        <Input
                          value={paymentSettings.remitaServiceTypeId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, remitaServiceTypeId: e.target.value })}
                          placeholder="Enter service type ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <Input
                          type="password"
                          value={paymentSettings.remitaApiKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, remitaApiKey: e.target.value })}
                          placeholder={paymentSettings.remitaApiKey ? "••••••••••••" : "Enter API key"}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to keep current key</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              {saved && (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium self-center">Settings saved!</span>
              )}
              {error && (
                <span className="text-red-500 dark:text-red-400 text-sm font-medium self-center">{error}</span>
              )}
              <Button onClick={handleSavePaymentSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Payment Settings'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}