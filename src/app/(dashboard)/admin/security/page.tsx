'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, MapPin, Activity, Copy, Check, AlertTriangle } from 'lucide-react';

export default function SecuritySettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginAttempts: 0,
    isLocked: false,
  });
  
  const [ipConfig, setIpConfig] = useState({
    allowedIps: [] as string[],
    lastLoginIp: null,
  });
  
  const [newIp, setNewIp] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSecurityStatus();
    fetchIpConfig();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSecurity(data);
      }
    } catch (err) {
      console.error('Failed to fetch security status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIpConfig = async () => {
    try {
      const res = await fetch('/api/auth/ip', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIpConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch IP config:', err);
    }
  };

  const setup2FA = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setBackupCodes(data.backupCodes);
        setShowSetup(true);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const enable2FA = async (code: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', code }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setShowSetup(false);
        setBackupCodes([]);
        fetchSecurityStatus();
      } else {
        setError(data.error || 'Failed to enable 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const disable2FA = async (password: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', code: password }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchSecurityStatus();
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addIp = async () => {
    if (!newIp) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ip: newIp }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setIpConfig({ ...ipConfig, allowedIps: data.allowedIps });
        setNewIp('');
        setMessage('IP address added');
      } else {
        setError(data.error || 'Failed to add IP');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const removeIp = async (ip: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', ip }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setIpConfig({ ...ipConfig, allowedIps: data.allowedIps });
        setMessage('IP address removed');
      } else {
        setError(data.error || 'Failed to remove IP');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600">Manage your Super Admin security preferences</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {security.isLocked && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          Your account is currently locked due to too many failed login attempts.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {security.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">2FA is enabled</span>
              </div>
              <p className="text-sm text-gray-600">
                Your account is protected with two-factor authentication.
              </p>
              <button
                onClick={() => {
                  const password = prompt('Enter your password to disable 2FA:');
                  if (password) disable2FA(password);
                }}
                disabled={saving}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Disable 2FA
              </button>
            </div>
          ) : showSetup ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Save Your Backup Codes</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Store these codes safely. You can use them to access your account if you lose your 2FA device.
                </p>
                <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="inline-block mr-4">{code}</div>
                  ))}
                </div>
                <button
                  onClick={copyBackupCodes}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  id="verifyCode"
                />
                <button
                  onClick={() => {
                    const code = (document.getElementById('verifyCode') as HTMLInputElement).value;
                    enable2FA(code);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enable two-factor authentication to add an extra layer of security.
                You'll need to enter a code from your authenticator app when logging in.
              </p>
              <button
                onClick={setup2FA}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Setting up...' : 'Setup 2FA'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">IP Address Restriction</h2>
              <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Add IP addresses to restrict Super Admin access. If no IPs are added, access is allowed from anywhere.
            Last login was from: <strong>{ipConfig.lastLoginIp || 'Unknown'}</strong>
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="e.g., 192.168.1.1 or 10.0.0.*"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={addIp}
              disabled={saving || !newIp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add IP
            </button>
          </div>

          {ipConfig.allowedIps.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Allowed IPs:</h3>
              <ul className="space-y-2">
                {ipConfig.allowedIps.map((ip, i) => (
                  <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">{ip}</span>
                    <button
                      onClick={() => removeIp(ip)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No IP restrictions configured</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
              <p className="text-sm text-gray-600">View your recent login activity</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Last Login</dt>
              <dd className="font-medium text-gray-900">
                {security.lastLoginAt ? new Date(security.lastLoginAt).toLocaleString() : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Last Login IP</dt>
              <dd className="font-medium text-gray-900">{security.lastLoginIp || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Failed Attempts</dt>
              <dd className="font-medium text-gray-900">{security.failedLoginAttempts}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Account Status</dt>
              <dd className={`font-medium ${security.isLocked ? 'text-red-600' : 'text-green-600'}`}>
                {security.isLocked ? 'Locked' : 'Active'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}