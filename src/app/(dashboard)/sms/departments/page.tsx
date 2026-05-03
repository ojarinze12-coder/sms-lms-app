'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { DEFAULT_SSS_DEPARTMENTS } from '@/lib/constants/departments';
import { useBranch } from '@/lib/hooks/use-branch';

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  alias?: string | null;
  isActive: boolean;
  tierId: string | null;
  tier?: Tier;
  teachers?: Teacher[];
  _count?: {
    subjects: number;
    classes: number;
  };
}

export default function DepartmentsPage() {
  const { selectedBranch } = useBranch();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDefaultsModal, setShowDefaultsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHODModal, setShowHODModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [hodDepartment, setHODDepartment] = useState<Department | null>(null);
  const [selectedHODId, setSelectedHODId] = useState<string>('');
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
    loadTeachers();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedTierId) {
      loadDepartments(selectedTierId);
    }
  }, [selectedTierId, selectedBranch]);

  const loadTiers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/tiers' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
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

  const loadTeachers = async () => {
    try {
      const res = await authFetch('/api/sms/teachers');
      const data = await res.json();
      setTeachers(data.data || []);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const loadDepartments = async (tierId: string) => {
    try {
      const params = new URLSearchParams();
      params.set('tierId', tierId);
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/departments?' + params.toString();
      const res = await authFetch(url);
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
      const res = await authFetch(`/api/sms/departments/${editingDept.id}`, {
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

  const handleAssignHOD = (dept: Department) => {
    setHODDepartment(dept);
    const currentHOD = dept.teachers?.find(t => t.position === 'HOD');
    setSelectedHODId(currentHOD?.id || '');
    setShowHODModal(true);
  };

  const handleSaveHOD = async () => {
    if (!hodDepartment) return;
    
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch(`/api/sms/departments/${hodDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headId: selectedHODId || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to assign HOD');
        return;
      }

      setShowHODModal(false);
      setHODDepartment(null);
      loadDepartments(selectedTierId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyDefaults = async () => {
    if (!selectedTierId) return;
    
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/sms/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applyDefaults: true,
          tierId: selectedTierId,
          branchId: selectedBranch?.id || null,
        }),
      });

      if (res.ok) {
        setShowDefaultsModal(false);
        loadDepartments(selectedTierId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create default departments');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTierId) return;
    
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/sms/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          alias: formData.alias || null,
          tierId: selectedTierId,
          branchId: selectedBranch?.id || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', code: '', alias: '', tierId: '' });
        loadDepartments(selectedTierId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create department');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold dark:text-white">Departments</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage departments/streams for each tier</p>
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Tier
        </label>
        <select
          value={selectedTierId}
          onChange={(e) => setSelectedTierId(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Please select a tier to view and manage departments.
        </div>
      )}

      {selectedTierId && !isSSSTier && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Only the SSS (Senior Secondary School) tier typically has departments/streams.
          Select SSS tier to manage departments.
        </div>
      )}

      {selectedTierId && isSSSTier && departments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No departments configured</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
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
              className={`bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 ${!dept.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold dark:text-white">{dept.alias || dept.name}</h3>
                    {!dept.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dept.code}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subjects:</span>
                  <span className="font-medium dark:text-white">{dept._count?.subjects || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Classes:</span>
                  <span className="font-medium dark:text-white">{dept._count?.classes || 0}</span>
                </div>
                {dept.teachers && dept.teachers.length > 0 && (
                  <div className="pt-2 border-t dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">HOD: </span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {dept.teachers[0].firstName} {dept.teachers[0].lastName}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => handleAssignHOD(dept)}
                  className="flex-1 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                >
                  {dept.teachers?.length ? 'Change HOD' : 'Assign HOD'}
                </button>
                <button
                  onClick={() => handleEdit(dept)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept)}
                  className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Default Departments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will create the following departments with their default subjects:
            </p>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {DEFAULT_SSS_DEPARTMENTS.map((dept) => (
                <div key={dept.code} className="border dark:border-gray-700 rounded-lg p-3">
                  <div className="font-medium dark:text-white">{dept.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                className="px-6 py-2 border dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sciences"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code (3 letters)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().slice(0, 3) })}
                  placeholder="e.g., SCI"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="e.g., STEM"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="px-6 py-2 border dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Edit Department</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="e.g., STEM"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="px-6 py-2 border dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOD Assignment Modal */}
      {showHODModal && hodDepartment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              Assign HOD - {hodDepartment.name}
            </h2>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Head of Department
              </label>
              <select
                value={selectedHODId}
                onChange={(e) => setSelectedHODId(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- No HOD Assigned --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                The selected teacher will have access to all exams in this department.
              </p>
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSaveHOD}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Assign HOD'}
              </button>
              <button
                onClick={() => {
                  setShowHODModal(false);
                  setHODDepartment(null);
                  setError('');
                }}
                className="px-6 py-2 border dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
