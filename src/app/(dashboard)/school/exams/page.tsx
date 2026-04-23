'use client';

import React, { useEffect, useState } from 'react';
import { BackButton } from '@/components/BackButton';

interface Grade {
  letter: string;
  minScore: number;
  maxScore: number;
  description: string;
  gradePoint: number;
}

interface GradingScale {
  name: string;
  description: string;
  isDefault: boolean;
  grades: Grade[];
}

const DEFAULT_GRADING_SCALES: Record<string, GradingScale> = {
  'nigerian': {
    name: 'Nigerian Standard',
    description: 'Standard NERDC grading scale used in Nigeria',
    isDefault: true,
    grades: [
      { letter: 'A1', minScore: 90, maxScore: 100, description: 'Excellent', gradePoint: 4.0 },
      { letter: 'A2', minScore: 80, maxScore: 89, description: 'Very Good', gradePoint: 3.5 },
      { letter: 'B1', minScore: 75, maxScore: 79, description: 'Good', gradePoint: 3.25 },
      { letter: 'B2', minScore: 70, maxScore: 74, description: 'Good', gradePoint: 3.0 },
      { letter: 'C1', minScore: 65, maxScore: 69, description: 'Credit', gradePoint: 2.75 },
      { letter: 'C2', minScore: 60, maxScore: 64, description: 'Credit', gradePoint: 2.5 },
      { letter: 'D1', minScore: 55, maxScore: 59, description: 'Pass', gradePoint: 2.25 },
      { letter: 'D2', minScore: 50, maxScore: 54, description: 'Pass', gradePoint: 2.0 },
      { letter: 'E', minScore: 40, maxScore: 49, description: 'Fair', gradePoint: 1.5 },
      { letter: 'F', minScore: 0, maxScore: 39, description: 'Fail', gradePoint: 0.0 },
    ],
  },
  '5point': {
    name: '5-Point Scale',
    description: 'Traditional 5-point grading scale',
    isDefault: false,
    grades: [
      { letter: 'A', minScore: 80, maxScore: 100, description: 'Excellent', gradePoint: 5.0 },
      { letter: 'B', minScore: 60, maxScore: 79, description: 'Good', gradePoint: 4.0 },
      { letter: 'C', minScore: 50, maxScore: 59, description: 'Average', gradePoint: 3.0 },
      { letter: 'D', minScore: 45, maxScore: 49, description: 'Pass', gradePoint: 2.0 },
      { letter: 'E', minScore: 40, maxScore: 44, description: 'Pass', gradePoint: 1.0 },
      { letter: 'F', minScore: 0, maxScore: 39, description: 'Fail', gradePoint: 0.0 },
    ],
  },
  'percentage': {
    name: 'Percentage Only',
    description: 'Direct percentage with no letter grades',
    isDefault: false,
    grades: [
      { letter: 'A', minScore: 90, maxScore: 100, description: 'Distinction', gradePoint: 4.0 },
      { letter: 'B', minScore: 80, maxScore: 89, description: 'Very Good', gradePoint: 3.5 },
      { letter: 'C', minScore: 70, maxScore: 79, description: 'Good', gradePoint: 3.0 },
      { letter: 'D', minScore: 60, maxScore: 69, description: 'Pass', gradePoint: 2.0 },
      { letter: 'E', minScore: 50, maxScore: 59, description: 'Pass', gradePoint: 1.0 },
      { letter: 'F', minScore: 0, maxScore: 49, description: 'Fail', gradePoint: 0.0 },
    ],
  },
};

export default function GradingScalesPage() {
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingScale, setEditingScale] = useState<string | null>(null);
  const [formData, setFormData] = useState<GradingScale>({
    name: '',
    description: '',
    isDefault: false,
    grades: [],
  });

  useEffect(() => {
    fetchScales();
  }, []);

  const fetchScales = async () => {
    try {
      const res = await fetch('/api/school/grading-scales');
      if (res.ok) {
        const data = await res.json();
        setScales(data.scales || []);
      } else {
        setScales([DEFAULT_GRADING_SCALES['nigerian']]);
      }
    } catch (err) {
      setScales([DEFAULT_GRADING_SCALES['nigerian']]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/school/grading-scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingScale(null);
        fetchScales();
      }
    } catch (err) {
      console.error('Failed to save grading scale:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scaleName: string) => {
    if (!confirm('Delete this grading scale?')) return;

    try {
      const res = await fetch(`/api/school/grading-scales?name=${encodeURIComponent(scaleName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchScales();
      }
    } catch (err) {
      console.error('Failed to delete scale:', err);
    }
  };

  const handleSetDefault = async (scaleName: string) => {
    try {
      const res = await fetch('/api/school/grading-scales/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scaleName }),
      });
      if (res.ok) {
        fetchScales();
      }
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const openEditModal = (scale: GradingScale) => {
    setEditingScale(scale.name);
    setFormData({ ...scale });
    setShowModal(true);
  };

  const addGrade = () => {
    setFormData({
      ...formData,
      grades: [
        ...formData.grades,
        { letter: '', minScore: 0, maxScore: 0, description: '', gradePoint: 0 },
      ],
    });
  };

  const updateGrade = (index: number, field: keyof Grade, value: string | number) => {
    const newGrades = [...formData.grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setFormData({ ...formData, grades: newGrades });
  };

  const removeGrade = (index: number) => {
    setFormData({
      ...formData,
      grades: formData.grades.filter((_, i) => i !== index),
    });
  };

  const importTemplate = (templateKey: string) => {
    const template = DEFAULT_GRADING_SCALES[templateKey];
    if (template) {
      setFormData({ ...template, name: '', isDefault: false });
      setShowModal(true);
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
    <div>
      <BackButton href="/school/academics" label="Back to Academics" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grading Scales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure how scores are converted to grades</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            onChange={(e) => importTemplate(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            defaultValue=""
          >
            <option value="">Import Template...</option>
            <option value="nigerian">Nigerian Standard (NERDC)</option>
            <option value="5point">5-Point Scale</option>
            <option value="percentage">Percentage Only</option>
          </select>
          <button
            onClick={() => {
              setEditingScale(null);
              setFormData({ name: '', description: '', isDefault: false, grades: [] });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Scale
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {scales.map((scale) => (
          <div
            key={scale.name}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 ${
              scale.isDefault ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{scale.name}</h3>
                  {scale.isDefault && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{scale.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {!scale.isDefault && (
                  <button
                    onClick={() => handleSetDefault(scale.name)}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => openEditModal(scale)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(scale.name)}
                  className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Letter</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Min Score</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Max Score</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scale.grades.map((grade, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{grade.letter}</td>
                      <td className="px-3 py-2">{grade.minScore}</td>
                      <td className="px-3 py-2">{grade.maxScore}</td>
                      <td className="px-3 py-2 text-gray-500">{grade.description}</td>
                      <td className="px-3 py-2">{grade.gradePoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {editingScale ? 'Edit Grading Scale' : 'Create Grading Scale'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scale Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., My School Scale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default scale</label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Grades</label>
                  <button
                    type="button"
                    onClick={addGrade}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add Grade
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.grades.map((grade, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={grade.letter}
                        onChange={(e) => updateGrade(idx, 'letter', e.target.value)}
                        placeholder="A"
                        className="flex-1 px-2 py-1 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={grade.minScore}
                        onChange={(e) => updateGrade(idx, 'minScore', parseFloat(e.target.value))}
                        placeholder="Min"
                        className="w-20 px-2 py-1 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        step="0.1"
                        value={grade.maxScore}
                        onChange={(e) => updateGrade(idx, 'maxScore', parseFloat(e.target.value))}
                        placeholder="Max"
                        className="w-20 px-2 py-1 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={grade.gradePoint}
                        onChange={(e) => updateGrade(idx, 'gradePoint', parseFloat(e.target.value))}
                        placeholder="GP"
                        className="w-16 px-2 py-1 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={grade.minScore}
                        onChange={(e) => updateGrade(idx, 'minScore', parseInt(e.target.value))}
                        placeholder="Min"
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={grade.maxScore}
                        onChange={(e) => updateGrade(idx, 'maxScore', parseInt(e.target.value))}
                        placeholder="Max"
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <input
                        type="text"
                        value={grade.description}
                        onChange={(e) => updateGrade(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={grade.gradePoint}
                        onChange={(e) => updateGrade(idx, 'gradePoint', parseFloat(e.target.value))}
                        placeholder="GP"
                        className="w-16 px-2 py-1 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeGrade(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || formData.grades.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
