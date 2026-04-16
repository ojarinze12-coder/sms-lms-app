'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Building2, Users, GraduationCap, UserCog, TrendingUp, Calendar, Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  plan: string;
  createdAt: string;
  branches: { id: string; name: string; code: string; isMain: boolean }[];
  _count: {
    students: number;
    teachers: number;
    staff: number;
  };
}

interface GroupStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
}

export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    aiEnabled: false,
    openRouterApiKey: '',
    openRouterModel: 'qwen/qwen2.5-72b-instruct:free',
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchGroupData();
      fetchAiSettings();
    }
  }, [authLoading, user]);

  const fetchGroupData = async () => {
    try {
      const res = await authFetch('/api/owner/groups');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setGroupStats(data.groupStats || null);
      } else {
        setError('Failed to load group data');
      }
} catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSettings = async () => {
    try {
      const res = await authFetch('/api/owner/settings');
      if (res.ok) {
        const data = await res.json();
        setAiSettings({
          aiEnabled: data.settings?.aiEnabled || false,
          openRouterApiKey: data.settings?.openRouterApiKey || '',
          openRouterModel: data.settings?.openRouterModel || 'qwen/qwen2.5-72b-instruct:free',
        });
      }
    } catch (err) {
      console.error('Error loading AI settings:', err);
    }
  };

  const handleSaveAiSettings = async () => {
    setAiSaving(true);
    try {
      const res = await authFetch('/api/owner/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiEnabled: aiSettings.aiEnabled,
          openRouterApiKey: aiSettings.openRouterApiKey || null,
          openRouterModel: aiSettings.openRouterModel,
        }),
      });

      if (res.ok) {
        setAiSaved(true);
        setTimeout(() => setAiSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving AI settings:', err);
    } finally {
      setAiSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchGroupData} className="mt-4 text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Group Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Managing {tenants.length} school{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

{groupStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalSchools}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalStudents.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalTeachers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalStaff.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>AI Configuration</CardTitle>
          </div>
          <CardDescription>Configure OpenRouter API settings for all schools in your group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable AI Features</p>
              <p className="text-sm text-gray-500">Allow schools to use AI for timetable, exams, and chat</p>
            </div>
            <input
              type="checkbox"
              checked={aiSettings.aiEnabled}
              onChange={(e) => setAiSettings({ ...aiSettings, aiEnabled: e.target.checked })}
              className="h-5 w-5"
            />
          </div>

          {aiSettings.aiEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">OpenRouter API Key</label>
                <Input
                  type="password"
                  value={aiSettings.openRouterApiKey}
                  onChange={(e) => setAiSettings({ ...aiSettings, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">AI Model</label>
                <Select
                  value={aiSettings.openRouterModel}
                  onValueChange={(value) => setAiSettings({ ...aiSettings, openRouterModel: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qwen/qwen2.5-72b-instruct:free">Qwen 2.5 72B (Free)</SelectItem>
                    <SelectItem value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</SelectItem>
                    <SelectItem value="deepseek/deepseek-chat:free">DeepSeek Chat (Free)</SelectItem>
                    <SelectItem value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</SelectItem>
                    <SelectItem value="google/gemma-3n-e4b-it:free">Gemma 3N (Free)</SelectItem>
                    <SelectItem value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {aiSaved && <span className="text-green-600 text-sm self-center">Saved!</span>}
            <Button onClick={handleSaveAiSettings} disabled={aiSaving}>
              {aiSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save AI Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Schools</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No schools found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">School</th>
                    <th className="text-left py-3 px-4 font-medium">Plan</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Students</th>
                    <th className="text-left py-3 px-4 font-medium">Teachers</th>
                    <th className="text-left py-3 px-4 font-medium">Staff</th>
                    <th className="text-left py-3 px-4 font-medium">Branches</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.domain || tenant.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' :
                          tenant.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700' :
                          tenant.plan === 'STARTER' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tenant._count.students.toLocaleString()}</td>
                      <td className="py-3 px-4">{tenant._count.teachers.toLocaleString()}</td>
                      <td className="py-3 px-4">{tenant._count.staff.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {tenant.branches.length > 0 ? (
                          <div className="text-sm">
                            {tenant.branches.length} branch{tenant.branches.length !== 1 ? 'es' : ''}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/tenants/${tenant.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
