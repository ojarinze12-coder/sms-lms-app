'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSubjectsByLevel } from '@/lib/nigeria';

interface AcademicYear {
  id: string;
  name: string;
  isActive?: boolean;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  capacity: number;
  academicYearId: string;
  subjects?: { id: string }[];
  enrollments?: { id: string }[];
}

export default function ClassesPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    capacity: '40',
    addNerdcSubjects: true,
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    level: '',
    capacity: '40',
    addNerdcSubjects: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadClasses(selectedYearId);
    }
  }, [selectedYearId]);

  const loadYears = async () => {
    try {
      const res = await fetch('/api/sms/academic-years');
      const data = await res.json();
      setYears(data);
      if (data.length > 0) {
        const activeYear = data.find((y: AcademicYear) => y.isActive);
        setSelectedYearId(activeYear?.id || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load years:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (yearId: string) => {
    try {
      const res = await fetch(`/api/sms/academic-classes?academicYearId=${yearId}`);
      const data = await res.json();
      setClasses(data.data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name: formData.name,
      level: parseInt(formData.level),
      academicYearId: selectedYearId,
      capacity: parseInt(formData.capacity),
      addNerdcSubjects: formData.addNerdcSubjects,
    };
    console.log('Creating class with payload:', payload);

    try {
      const res = await fetch('/api/sms/academic-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          level: parseInt(formData.level),
          academicYearId: selectedYearId,
          capacity: parseInt(formData.capacity),
          addNerdcSubjects: formData.addNerdcSubjects,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create class');
        return;
      }

      setShowModal(false);
      setFormData({ name: '', level: '', capacity: '40', addNerdcSubjects: true });
      loadClasses(selectedYearId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls: AcademicClass) => {
    setEditingClass(cls);
    setEditFormData({
      name: cls.name,
      level: cls.level.toString(),
      capacity: cls.capacity.toString(),
      addNerdcSubjects: false,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/sms/academic-classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          level: parseInt(editFormData.level),
          capacity: parseInt(editFormData.capacity),
          addNerdcSubjects: editFormData.addNerdcSubjects,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingClass(null);
        setEditFormData({ name: '', level: '', capacity: '40', addNerdcSubjects: false });
        loadClasses(selectedYearId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update class');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelName = (level: number) => {
    if (level === 0) return 'Creche';
    if (level === 1) return 'Pre-Nursery';
    if (level >= 2 && level <= 4) return `Nursery ${level - 1}`;
    if (level >= 5 && level <= 10) return `Primary ${level - 4}`;
    if (level >= 11 && level <= 13) return `JSS ${level - 10}`;
    if (level >= 14 && level <= 16) return `SSS ${level - 13}`;
    return `Level ${level}`;
  };

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
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-gray-600">Manage classes for each academic year</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedYearId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add Class
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Academic Year
        </label>
        <select
          value={selectedYearId}
          onChange={(e) => setSelectedYearId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-lg"
        >
          <option value="">Select a year...</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      {selectedYearId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border p-8 text-center text-gray-500">
              No classes yet. Add your first class for this academic year.
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-500">
                      {getLevelName(cls.level)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {getLevelName(cls.level)}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
                  <span>Capacity: {cls.capacity}</span>
                  <span>Subjects: {cls.subjects?.length || 0}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/sms/classes/${cls.id}/subjects`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Subjects
                  </Link>
                  <button
                    onClick={() => handleEdit(cls)}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!selectedYearId && years.length > 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Please select an academic year to view its classes.
        </div>
      )}

      {years.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          No academic years found. Please{' '}
          <Link href="/sms/academic-years" className="text-blue-600 hover:underline">
            create an academic year
          </Link>{' '}
          first.
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grade 10-A"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select...</option>
                    <optgroup label="Pre-School">
                      <option value="0">Creche</option>
                      <option value="1">Pre-Nursery</option>
                    </optgroup>
                    <optgroup label="Nursery">
                      <option value="2">Nursery 1</option>
                      <option value="3">Nursery 2</option>
                      <option value="4">Nursery 3</option>
                    </optgroup>
                    <optgroup label="Primary">
                      <option value="5">Primary 1</option>
                      <option value="6">Primary 2</option>
                      <option value="7">Primary 3</option>
                      <option value="8">Primary 4</option>
                      <option value="9">Primary 5</option>
                      <option value="10">Primary 6</option>
                    </optgroup>
                    <optgroup label="Junior Secondary (JSS)">
                      <option value="11">JSS 1</option>
                      <option value="12">JSS 2</option>
                      <option value="13">JSS 3</option>
                    </optgroup>
                    <optgroup label="Senior Secondary (SSS)">
                      <option value="14">SSS 1</option>
                      <option value="15">SSS 2</option>
                      <option value="16">SSS 3</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addNerdcSubjects"
                  checked={formData.addNerdcSubjects}
                  onChange={(e) => setFormData({ ...formData, addNerdcSubjects: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="addNerdcSubjects" className="text-sm text-gray-700">
                  Add NERDC subjects for this class level
                </label>
              </div>

              {formData.addNerdcSubjects && formData.level && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {(() => {
                    const level = parseInt(formData.level);
                    const subjects = isNaN(level) ? [] : getSubjectsByLevel(level);
                    return `Will add ${subjects.length} subjects: ${subjects.slice(0, 3).map(s => s.name).join(', ')}...`;
                  })()}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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

      {/* Edit Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Class</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Level
                  </label>
                  <select
                    value={editFormData.level}
                    onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select...</option>
                    <optgroup label="Pre-School">
                      <option value="0">Creche</option>
                      <option value="1">Pre-Nursery</option>
                    </optgroup>
                    <optgroup label="Nursery">
                      <option value="2">Nursery 1</option>
                      <option value="3">Nursery 2</option>
                      <option value="4">Nursery 3</option>
                    </optgroup>
                    <optgroup label="Primary">
                      <option value="5">Primary 1</option>
                      <option value="6">Primary 2</option>
                      <option value="7">Primary 3</option>
                      <option value="8">Primary 4</option>
                      <option value="9">Primary 5</option>
                      <option value="10">Primary 6</option>
                    </optgroup>
                    <optgroup label="Junior Secondary (JSS)">
                      <option value="11">JSS 1</option>
                      <option value="12">JSS 2</option>
                      <option value="13">JSS 3</option>
                    </optgroup>
                    <optgroup label="Senior Secondary (SSS)">
                      <option value="14">SSS 1</option>
                      <option value="15">SSS 2</option>
                      <option value="16">SSS 3</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editAddNerdcSubjects"
                  checked={editFormData.addNerdcSubjects}
                  onChange={(e) => setEditFormData({ ...editFormData, addNerdcSubjects: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="editAddNerdcSubjects" className="text-sm text-gray-700">
                  Add missing NERDC subjects for this level
                </label>
              </div>

              {editFormData.addNerdcSubjects && editFormData.level && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {(() => {
                    const level = parseInt(editFormData.level);
                    const subjects = isNaN(level) ? [] : getSubjectsByLevel(level);
                    return `Will add missing subjects from: ${subjects.slice(0, 3).map(s => s.name).join(', ')}...`;
                  })()}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClass(null);
                    setError('');
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
