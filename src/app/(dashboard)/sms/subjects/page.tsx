'use client';

import { useEffect, useState } from 'react';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import { authFetch } from '@/lib/auth-fetch';
import { CURRICULUM_INFO } from '@/types';

interface AcademicYear {
  id: string;
  name: string;
  isActive?: boolean;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
  curriculum?: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  curriculum: string;
  academicClassId: string;
  teacherId: string | null;
  academic_classes: AcademicClass;
  teachers: Teacher | null;
}

export default function SubjectsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [currentCurriculum, setCurrentCurriculum] = useState<string>('NERDC');
  const [predefinedSubjects, setPredefinedSubjects] = useState<{ name: string; code: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadYears();
    loadTeachers();
    loadCurriculum();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadClasses(selectedYearId);
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId);
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass) {
        updatePredefinedSubjects(selectedClass.level);
      }
    }
  }, [selectedClassId, classes]);

  const loadYears = async () => {
    try {
      const res = await authFetch('/api/sms/academic-years');
      if (!res.ok) {
        console.error('Failed to load years:', res.status);
        return;
      }
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

  const loadCurriculum = async () => {
    try {
      const res = await authFetch('/api/tenant/curriculum');
      if (res.ok) {
        const data = await res.json();
        if (data.data?.settings?.curriculumType) {
          setCurrentCurriculum(data.data.settings.curriculumType);
        }
      }
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    }
  };

  const loadClasses = async (yearId: string) => {
    try {
      const res = await authFetch(`/api/sms/academic-classes?academicYearId=${yearId}`);
      if (!res.ok) {
        console.error('Failed to load classes:', res.status);
        return;
      }
      const data = await res.json();
      setClasses(data.data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await authFetch('/api/sms/teachers');
      if (!res.ok) {
        console.error('Failed to load teachers:', res.status);
        return;
      }
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const loadSubjects = async (classId: string) => {
    try {
      const res = await authFetch(`/api/sms/subjects?academicYearId=${classId}`);
      if (!res.ok) {
        console.error('Failed to load subjects:', res.status);
        return;
      }
      const data = await res.json();
      setSubjects(data.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const updatePredefinedSubjects = (level: number) => {
    const subs = getSubjectsByCurriculum(level, currentCurriculum);
    setPredefinedSubjects(subs);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      teacherId: subject.teacherId || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/sms/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherId: formData.teacherId || null,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingSubject(null);
        setFormData({ name: '', code: '', teacherId: '' });
        loadSubjects(selectedClassId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update subject');
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
      const res = await authFetch('/api/sms/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          academicClassId: selectedClassId,
          teacherId: formData.teacherId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create subject');
        return;
      }

      setShowModal(false);
      setFormData({ name: '', code: '', teacherId: '' });
      loadSubjects(selectedClassId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold dark:text-white">Subjects</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage subjects for each class</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedClassId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600"
        >
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Academic Year
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => {
              setSelectedYearId(e.target.value);
              setSelectedClassId('');
            }}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a year...</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            disabled={!selectedYearId}
          >
            <option value="">Select a class...</option>
            {classes.map((cls) => {
              const fullClassName = cls.department 
                ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                : cls.stream 
                  ? `${cls.name}-${cls.stream}`
                  : cls.name;
              return (
                <option key={cls.id} value={cls.id}>
                  {fullClassName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedClassId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No subjects yet. Add your first subject for this class.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium dark:text-white">{subject.code}</td>
                    <td className="px-6 py-4 text-sm dark:text-gray-300">{subject.name}</td>
                    <td className="px-6 py-4 text-sm dark:text-gray-300">
                      {subject.teachers ? (
                        <span className="dark:text-gray-300">{subject.teachers.firstName} {subject.teachers.lastName}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => handleEdit(subject)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedClassId && classes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Please select a class to view its subjects.
        </div>
      )}

      {!selectedYearId && years.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Please select an academic year and class to view subjects.
        </div>
      )}

      {years.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No academic years found. Please create an academic year first.
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {predefinedSubjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select from Predefined Subjects ({CURRICULUM_INFO[currentCurriculum as keyof typeof CURRICULUM_INFO]?.name || currentCurriculum})
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = predefinedSubjects.find(s => s.code === e.target.value);
                      if (selected) {
                        setFormData({ ...formData, name: selected.name, code: selected.code });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="">-- Select predefined subject or enter custom --</option>
                    {predefinedSubjects.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MATH"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} {teacher.specialty ? `(${teacher.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

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
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Edit Subject</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {predefinedSubjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select from Predefined Subjects ({CURRICULUM_INFO[currentCurriculum as keyof typeof CURRICULUM_INFO]?.name || currentCurriculum})
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = predefinedSubjects.find(s => s.code === e.target.value);
                      if (selected) {
                        setFormData({ ...formData, name: selected.name, code: selected.code });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="">-- Select predefined subject or enter custom --</option>
                    {predefinedSubjects.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MATH"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} {teacher.specialty ? `(${teacher.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

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
                    setEditingSubject(null);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
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
