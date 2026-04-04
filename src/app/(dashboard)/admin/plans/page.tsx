'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  maxStorageGB: number;
  maxAICalls: number;
  features: Record<string, boolean>;
  isActive: boolean;
  sortOrder: number;
  activeSubscriptions: number;
}

const FEATURE_LIST = [
  { key: 'basicSMS', label: 'SMS Notifications' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'feeCollection', label: 'Fee Collection' },
  { key: 'lms', label: 'Learning Management System' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'prioritySupport', label: 'Priority Support' },
  { key: 'customBranding', label: 'Custom Branding' },
  { key: 'transport', label: 'Transport Management' },
  { key: 'hostel', label: 'Hostel Management' },
  { key: 'apiAccess', label: 'API Access' },
  { key: 'whiteLabel', label: 'White Label' },
  { key: 'dedicatedSupport', label: 'Dedicated Support' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 0,
    maxTeachers: 0,
    maxStorageGB: 1,
    maxAICalls: 0,
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans?includeInactive=true');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seedPlans = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed-defaults' }),
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      displayName: plan.displayName,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxStorageGB: plan.maxStorageGB,
      maxAICalls: plan.maxAICalls,
    });
    setFeatures(plan.features || {});
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    try {
      await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      await fetch(`/api/admin/plans/${editingPlan.id}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      setShowModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFeatureValue = (plan: Plan, key: string) => {
    return plan.features?.[key] ?? false;
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans & Billing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and pricing</p>
        </div>
        {plans.length === 0 && (
          <button
            onClick={seedPlans}
            disabled={seeding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Default Plans'}
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Plans Configured</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Set up your subscription plans to start monetizing your platform.</p>
          <button
            onClick={seedPlans}
            disabled={seeding}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {seeding ? 'Creating...' : 'Create Default Plans'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-6 ${
                plan.name === 'PROFESSIONAL' ? 'border-blue-500 relative' : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              {plan.name === 'PROFESSIONAL' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.displayName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(plan.monthlyPrice)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
                {plan.yearlyPrice > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or {formatCurrency(plan.yearlyPrice)}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {plan.maxStudents === 0 ? 'Unlimited' : plan.maxStudents.toLocaleString()} students
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.maxTeachers === 0 ? 'Unlimited' : plan.maxTeachers} teachers
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.maxStorageGB}GB storage
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.maxAICalls === 0 ? 'Unlimited' : plan.maxAICalls} AI calls/mo
                </p>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Features</p>
                <div className="space-y-2">
                  {FEATURE_LIST.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2">
                      {getFeatureValue(plan, feature.key) ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm ${getFeatureValue(plan, feature.key) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.activeSubscriptions} active
                </span>
                <button 
                  onClick={() => openEditModal(plan)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400"
                >
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Plan: {editingPlan.name}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price (₦)</label>
                  <input
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Price (₦)</label>
                  <input
                    type="number"
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Teachers</label>
                  <input
                    type="number"
                    value={formData.maxTeachers}
                    onChange={(e) => setFormData({ ...formData, maxTeachers: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={formData.maxStorageGB}
                    onChange={(e) => setFormData({ ...formData, maxStorageGB: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Calls/Month</label>
                  <input
                    type="number"
                    value={formData.maxAICalls}
                    onChange={(e) => setFormData({ ...formData, maxAICalls: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURE_LIST.map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={features[feature.key] || false}
                        onChange={(e) => setFeatures({ ...features, [feature.key]: e.target.checked })}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
