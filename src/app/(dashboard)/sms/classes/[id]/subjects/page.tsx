'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { NERDC_SUBJECTS } from '@/lib/nigeria';

interface Subject {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  teacher?: {
    firstName: string;
    lastName: string;
  };
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  capacity: number;
}

const NIGERIA_SUBJECT_OPTIONS = [
  ...NERDC_SUBJECTS.CORE,
  ...NERDC_SUBJECTS.LANGUAGES,
  ...NERDC_SUBJECTS.BEHAVIOURAL,
  ...NERDC_SUBJECTS.NINE_JA,
  ...NERDC_SUBJECTS.PRACTICAL,
  ...NERDC_SUBJECTS.CREATIVE,
].sort();

export default function ClassSubjectsPage() {
  const params = useParams();
  const [cls, setCls] = useState<AcademicClass | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherId: '',
    useCustomName: false,
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      // Load class details and subjects
      const [classRes, subjectsRes, teachersRes] = await Promise.all([
        fetch(`/api/sms/academic-classes?academicYearId=${params.id}`),
        fetch(`/api/sms/subjects?academicYearId=${params.id}`),
        fetch('/api/sms/teachers'),
      ]);
      
      const classData = await classRes.json();
      const subjectsData = await subjectsRes.json();
      const teachersData = await teachersRes.json();
      
      // Get the first class if params.id is a year, or find by id
      const classes = Array.isArray(classData.data) ? classData.data : [];
      const currentClass = classes.find((c: AcademicClass) => c.id === params.id) || classes[0];
      
      setCls(currentClass || null);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData.data || []));
      setTeachers(Array.isArray(teachersData) ? teachersData : (teachersData.data || []));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/sms/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          academicClassId: params.id,
          teacherId: formData.teacherId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', code: '', teacherId: '', useCustomName: false });
        loadData();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      teacherId: '',
      useCustomName: true,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sms/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          teacherId: formData.teacherId || null,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingSubject(null);
        setFormData({ name: '', code: '', teacherId: '', useCustomName: false });
        loadData();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (subject: Subject) => {
    try {
      const res = await fetch(`/api/sms/subjects/${subject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !subject.isActive,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error toggling subject:', err);
    }
  };

  const handleSubjectSelect = (subjectName: string) => {
    const code = subjectName.substring(0, 4).toUpperCase().replace(/\s/g, '');
    setFormData({ ...formData, name: subjectName, code, useCustomName: false });
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
      <div className="flex items-center gap-4">
        <Link
          href="/sms/classes"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{cls?.name || 'Class'} - Subjects</h1>
          <p className="text-gray-600">Manage subjects for this class</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Subjects ({subjects.length})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border p-8 text-center text-gray-500">
            No subjects yet. Add your first subject for this class.
          </div>
        ) : (
          subjects.map((subject) => (
            <div key={subject.id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${!subject.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!subject.isActive && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      Inactive
                    </span>
                  )}
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {subject.code}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p>Teacher: {subject.teacher ? `${subject.teacher.firstName} ${subject.teacher.lastName}` : 'Not assigned'}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(subject)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(subject)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    subject.isActive 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {subject.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select from NERDC Subjects
                </label>
                <select
                  value={formData.useCustomName ? '' : formData.name}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setFormData({ ...formData, name: '', code: '', useCustomName: true });
                    } else if (e.target.value) {
                      handleSubjectSelect(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select a subject --</option>
                  <optgroup label="Core Subjects">
                    {NERDC_SUBJECTS.CORE.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Languages">
                    {NERDC_SUBJECTS.LANGUAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Religious Studies">
                    {NERDC_SUBJECTS.BEHAVIOURAL.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Social Sciences">
                    {NERDC_SUBJECTS.NINE_JA.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Practical Subjects">
                    {NERDC_SUBJECTS.PRACTICAL.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Creative Arts">
                    {NERDC_SUBJECTS.CREATIVE.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <option value="__custom__">+ Custom Subject</option>
                </select>
              </div>

              {formData.useCustomName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Subject Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, useCustomName: true })}
                    placeholder="Enter subject name"
                    className="w-full px-3 py-2 border rounded-lg"
                    required={formData.useCustomName}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MATH"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher (Optional)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting || (!formData.name || !formData.code)}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', code: '', teacherId: '', useCustomName: false });
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

      {showEditModal && editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, useCustomName: true })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher (Optional)
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
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
                    setFormData({ name: '', code: '', teacherId: '', useCustomName: false });
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
