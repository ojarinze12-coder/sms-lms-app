'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SSS_DEPARTMENTS } from '@/lib/constants/departments';

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  alias?: string | null;
  isActive: boolean;
  tierId: string;
  tier?: Tier;
  _count?: {
    subjects: number;
    classes: number;
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDefaultsModal, setShowDefaultsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    alias: '',
    tierId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTiers();
  }, []);

  useEffect(() => {
    if (selectedTierId) {
      loadDepartments(selectedTierId);
    }
  }, [selectedTierId]);

  const loadTiers = async () => {
    try {
      const res = await fetch('/api/sms/tiers');
      const data = await res.json();
      const allTiers = data.data || [];
      setTiers(allTiers);
      
      // Select SSS tier by default if it exists
      const sssTier = allTiers.find((t: Tier) => t.code === 'SSS');
      if (sssTier) {
        setSelectedTierId(sssTier.id);
      } else if (allTiers.length > 0) {
        setSelectedTierId(allTiers[0].id);
      }
    } catch (err) {
      console.error('Failed to load tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (tierId: string) => {
    try {
      const res = await fetch(`/api/sms/departments?tierId=${tierId}`);
      const data = await res.json();
      setDepartments(data.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      alias: dept.alias || '',
      tierId: dept.tierId,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/sms/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          alias: formData.alias || null,
          isActive: editingDept.isActive,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingDept(null);
        setFormData({ name: '', code: '', alias: '', tierId: '' });
        loadDepartments(selectedTierId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update department');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sms/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create department');
        return;
      }

      setShowModal(false);
      setFormData({ name: '', code: '', alias: '', tierId: selectedTierId });
      loadDepartments(selectedTierId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyDefaults = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/sms/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applyDefaults: true,
          tierId: selectedTierId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create default departments');
        return;
      }

      setShowDefaultsModal(false);
      loadDepartments(selectedTierId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sms/departments/${dept.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete department');
        return;
      }

      loadDepartments(selectedTierId);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const selectedTier = tiers.find(t => t.id === selectedTierId);
  const isSSSTier = selectedTier?.code === 'SSS';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-gray-600">Manage departments/streams for each tier</p>
        </div>
        <div className="flex gap-3">
          {isSSSTier && departments.length === 0 && (
            <button
              onClick={() => setShowDefaultsModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Default Departments
            </button>
          )}
          <button
            onClick={() => {
              setFormData({ ...formData, tierId: selectedTierId });
              setShowModal(true);
            }}
            disabled={!selectedTierId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add Department
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tier
        </label>
        <select
          value={selectedTierId}
          onChange={(e) => setSelectedTierId(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border rounded-lg"
        >
          <option value="">Select a tier...</option>
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedTierId && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Please select a tier to view and manage departments.
        </div>
      )}

      {selectedTierId && !isSSSTier && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Only the SSS (Senior Secondary School) tier typically has departments/streams.
          Select SSS tier to manage departments.
        </div>
      )}

      {selectedTierId && isSSSTier && departments.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No departments configured</h3>
          <p className="text-gray-500 mb-4">
            Add departments (streams) for SSS level. Common departments include Sciences, Commercial, and Arts.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowDefaultsModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Default Departments
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Custom Department
            </button>
          </div>
        </div>
      )}

      {selectedTierId && isSSSTier && departments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={`bg-white rounded-xl border p-6 ${!dept.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{dept.alias || dept.name}</h3>
                    {!dept.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{dept.code}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subjects:</span>
                  <span className="font-medium">{dept._count?.subjects || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Classes:</span>
                  <span className="font-medium">{dept._count?.classes || 0}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={() => handleEdit(dept)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  disabled={(dept._count?.subjects || 0) > 0 || (dept._count?.classes || 0) > 0}
                  title={dept._count?.subjects ? 'Cannot delete department with subjects' : ''}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Default Departments Modal */}
      {showDefaultsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Default Departments</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will create the following departments with their default subjects:
            </p>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {DEFAULT_SSS_DEPARTMENTS.map((dept) => (
                <div key={dept.code} className="border rounded-lg p-3">
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dept.subjects.slice(0, 5).join(', ')}
                    {dept.subjects.length > 5 && ` +${dept.subjects.length - 5} more`}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleApplyDefaults}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create All Departments'}
              </button>
              <button
                onClick={() => {
                  setShowDefaultsModal(false);
                  setError('');
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sciences"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code (3 letters)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().slice(0, 3) })}
                  placeholder="e.g., SCI"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="e.g., STEM"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && editingDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Department</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="e.g., STEM"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDept(null);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
