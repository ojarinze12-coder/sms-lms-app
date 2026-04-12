'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface Module {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const AVAILABLE_MODULES: Omit<Module, 'enabled'>[] = [
  { key: 'online_fees', name: 'Online Fees Payment', description: 'Allow parents to pay fees online via Paystack/Flutterwave', category: 'Finance' },
  { key: 'transport', name: 'Transport Management', description: 'Manage school buses and routes', category: 'Logistics' },
  { key: 'library', name: 'Library Management', description: 'Book circulation and library tracking', category: 'Academics' },
  { key: 'hostel', name: 'Hostel Management', description: 'Manage student accommodation', category: 'Logistics' },
  { key: 'ai_timetable', name: 'AI Timetable Generator', description: 'Auto-generate class timetables using AI', category: 'AI Features' },
  { key: 'ai_exam', name: 'AI Exam Generator', description: 'Generate exam questions using AI', category: 'AI Features' },
  { key: 'sms_notifications', name: 'SMS Notifications', description: 'Send SMS alerts to parents', category: 'Communication' },
  { key: 'whatsapp_notifications', name: 'WhatsApp Notifications', description: 'Send WhatsApp messages', category: 'Communication' },
  { key: 'online_admissions', name: 'Online Admissions', description: 'Digital application and enrollment', category: 'Admissions' },
  { key: 'parent_portal', name: 'Parent Portal', description: 'Allow parents to access student data', category: 'Portals' },
  { key: 'student_portal', name: 'Student Portal', description: 'Student self-service portal', category: 'Portals' },
  { key: 'mobile_app', name: 'Mobile App', description: 'Access via mobile application', category: 'Portals' },
  { key: 'live_classes', name: 'Virtual Classrooms', description: 'Live video classes integration', category: 'LMS' },
  { key: 'discussion_forums', name: 'Discussion Forums', description: 'Course discussion boards', category: 'LMS' },
  { key: 'badges_certificates', name: 'Badges & Certificates', description: 'Gamification and awards', category: 'LMS' },
  { key: 'inventory', name: 'Asset Management', description: 'Track school equipment', category: 'Logistics' },
];

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    authFetchModules();
  }, []);

  const authFetchModules = async () => {
    try {
      const res = await authFetch('/api/sms/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      } else {
        setModules(AVAILABLE_MODULES.map(m => ({ ...m, enabled: false })));
      }
    } catch (err) {
      setModules(AVAILABLE_MODULES.map(m => ({ ...m, enabled: false })));
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (key: string) => {
    const updated = modules.map(m => 
      m.key === key ? { ...m, enabled: !m.enabled } : m
    );
    setModules(updated);

    setSaving(true);
    try {
      await authFetch('/api/sms/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey: key, enabled: !modules.find(m => m.key === key)?.enabled }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(AVAILABLE_MODULES.map(m => m.category)))];
  
  const filteredModules = filter === 'all' 
    ? modules 
    : modules.filter(m => {
      const meta = AVAILABLE_MODULES.find(am => am.key === m.key);
      return meta?.category === filter;
    });

  const enabledCount = modules.filter(m => m.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Module Activation</h1>
          <p className="text-gray-500 mt-1">Enable or disable features for your school</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {enabledCount} of {modules.length} modules enabled
          </span>
          {saving && <span className="text-sm text-blue-600">Saving...</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(module => {
          const meta = AVAILABLE_MODULES.find(m => m.key === module.key);
          return (
            <div
              key={module.key}
              className={`bg-white rounded-xl border-2 p-5 transition-all ${
                module.enabled 
                  ? 'border-green-200 shadow-sm' 
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  {meta && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {meta.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleModule(module.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    module.enabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      module.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-medium text-yellow-800">Note</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Some modules may require a subscription upgrade. Check your plan limits in Plans & Billing.
        </p>
      </div>
    </div>
  );
}
