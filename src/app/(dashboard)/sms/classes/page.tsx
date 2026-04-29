'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSubjectsByCurriculum } from '@/lib/nigeria';
import { Loader2, Plus, Pencil, Trash2, BookOpen, ChevronDown } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { CURRICULUM_INFO } from '@/types';
import { useBranch } from '@/lib/hooks/use-branch';

interface AcademicYear {
  id: string;
  name: string;
  isActive?: boolean;
}

interface Tier {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  tierId?: string;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  capacity: number;
  stream?: string | null;
  academicYearId: string;
  tierId?: string | null;
  department?: { id: string; name: string; code: string } | null;
  subjects?: { id: string }[];
  enrollments?: { id: string }[];
  classTeacher?: { id: string; firstName: string; lastName: string; employeeId: string; position: string | null } | null;
  formMaster?: { id: string; firstName: string; lastName: string; employeeId: string; position: string | null } | null;
  caregiver?: { id: string; firstName: string; lastName: string; employeeId: string; category: string } | null;
}

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  departmentRelation?: { id: string; name: string; code: string } | null;
}

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  category: string;
}

const STREAM_OPTIONS = {
  DEFAULT: ['A', 'B', 'C', 'D'] as string[],
  SSS: ['SCI', 'COMM', 'ARTS', 'TECH', 'GEN'] as string[],
};

export default function ClassesPage() {
  const { selectedBranch } = useBranch();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [currentCurriculum, setCurrentCurriculum] = useState<string>('NERDC');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    capacity: '40',
    addNerdcSubjects: true,
    tierId: '',
    departmentId: '',
    stream: '',
    classTeacherId: '',
    formMasterId: '',
    caregiverId: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    level: '',
    capacity: '40',
    addNerdcSubjects: false,
    tierId: '',
    departmentId: '',
    stream: '',
    classTeacherId: '',
    formMasterId: '',
    caregiverId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [streamOptions, setStreamOptions] = useState<string[]>(STREAM_OPTIONS.DEFAULT);
  const [editStreamOptions, setEditStreamOptions] = useState<string[]>(STREAM_OPTIONS.DEFAULT);
  const [isCustomStream, setIsCustomStream] = useState(false);
  const [editIsCustomStream, setEditIsCustomStream] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedTierCode, setSelectedTierCode] = useState<string>('');

  const getStreamOptions = (deptId?: string, deptCode?: string) => {
    // Stream is for classroom splitting (A, B, C, D) - always use default
    // Department/Track is selected separately for subject grouping
    return STREAM_OPTIONS.DEFAULT;
  };

  useEffect(() => {
    const dept = departments.find(d => d.id === formData.departmentId);
    const options = getStreamOptions(formData.departmentId, dept?.code);
    setStreamOptions(options);
  }, [formData.departmentId]);

  useEffect(() => {
    const dept = departments.find(d => d.id === editFormData.departmentId);
    const options = getStreamOptions(editFormData.departmentId, dept?.code);
    setEditStreamOptions(options);
  }, [editFormData.departmentId]);

  useEffect(() => {
    loadYears();
    loadTiers();
    loadDepartments();
    loadCurriculum();
    loadTeachers();
    loadStaff();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadClasses(selectedYearId);
    }
  }, [selectedYearId, selectedBranch]);

  // Tier detection for Create Modal
  useEffect(() => {
    let tierCode = '';
    if (formData.tierId) {
      const tier = tiers.find(t => t.id === formData.tierId);
      tierCode = tier?.code || '';
    } else if (formData.level) {
      const levelNum = parseInt(formData.level);
      if (levelNum <= 1) tierCode = 'PRE_NUR';
      else if (levelNum <= 4) tierCode = 'NUR';
      else if (levelNum <= 10) tierCode = 'PRI';
      else if (levelNum <= 13) tierCode = 'JSS';
      else if (levelNum <= 16) tierCode = 'SSS';
    }
    setSelectedTierCode(tierCode);
  }, [formData.tierId, formData.level, tiers]);

  const loadYears = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/academic-years' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (!res.ok) {
        console.error('Failed to load years:', res.status);
        return;
      }
      const data = await res.json();
      const yearList = data.years || [];
      setYears(yearList);
      if (yearList.length > 0) {
        const activeYear = yearList.find((y: AcademicYear) => y.isActive);
        setSelectedYearId(activeYear?.id || yearList[0].id);
      }
    } catch (err) {
      console.error('Failed to load years:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/tiers' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTiers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tiers:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/departments' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
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
      const params = new URLSearchParams();
      params.set('academicYearId', yearId);
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = `/api/sms/academic-classes?${params.toString()}`;
      const res = await authFetch(url);
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
      if (res.ok) {
        const data = await res.json();
        setTeachers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await authFetch('/api/sms/staff?category=CAREGIVER');
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const requestBody = {
      name: formData.name,
      level: parseInt(formData.level),
      academicYearId: selectedYearId,
      capacity: parseInt(formData.capacity),
      addNerdcSubjects: formData.addNerdcSubjects,
      tierId: formData.tierId || null,
      departmentId: formData.departmentId || null,
      stream: formData.stream || null,
      classTeacherId: formData.classTeacherId || null,
      formMasterId: formData.formMasterId || null,
      caregiverId: formData.caregiverId || null,
    };
    console.log('[CLASSES] Request body:', JSON.stringify(requestBody));

    try {
      const res = await authFetch('/api/sms/academic-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[CLASSES] Response status:', res.status);
      const responseData = await res.json();
      console.log('[CLASSES] Response data:', JSON.stringify(responseData));

      if (!res.ok) {
        setError(responseData.error || 'Failed to create class');
        return;
      }

      console.log('[CLASSES] Class created successfully, refreshing list');
      setShowModal(false);
      setFormData({ name: '', level: '', capacity: '40', addNerdcSubjects: true, tierId: '', departmentId: '', stream: '', classTeacherId: '', formMasterId: '', caregiverId: '' });
      setIsCustomStream(false);
      loadClasses(selectedYearId);
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls: AcademicClass) => {
    setEditingClass(cls);
    
    // Check if stream is custom (not in predefined options)
    const isCustom = cls.stream && !editStreamOptions.includes(cls.stream);
    setEditIsCustomStream(isCustom);
    
    // Detect tier code for the editing class
    let tierCode = '';
    if (cls.tierId) {
      const tier = tiers.find(t => t.id === cls.tierId);
      tierCode = tier?.code || '';
    } else {
      const levelNum = cls.level;
      if (levelNum <= 1) tierCode = 'PRE_NUR';
      else if (levelNum <= 4) tierCode = 'NUR';
      else if (levelNum <= 10) tierCode = 'PRI';
      else if (levelNum <= 13) tierCode = 'JSS';
      else if (levelNum <= 16) tierCode = 'SSS';
    }
    setSelectedTierCode(tierCode);
    
    setEditFormData({
      name: cls.name,
      level: cls.level.toString(),
      capacity: cls.capacity.toString(),
      addNerdcSubjects: false,
      tierId: cls.tierId || '',
      departmentId: cls.department?.id || '',
      stream: cls.stream || '',
      classTeacherId: cls.classTeacher?.id || '',
      formMasterId: cls.formMaster?.id || '',
      caregiverId: cls.caregiver?.id || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch(`/api/sms/academic-classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          level: parseInt(editFormData.level),
          capacity: parseInt(editFormData.capacity),
          addNerdcSubjects: editFormData.addNerdcSubjects,
          tierId: editFormData.tierId || null,
          departmentId: editFormData.departmentId || null,
          stream: editFormData.stream || null,
          classTeacherId: editFormData.classTeacherId || null,
          formMasterId: editFormData.formMasterId || null,
          caregiverId: editFormData.caregiverId || null,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingClass(null);
        setEditFormData({ name: '', level: '', capacity: '40', addNerdcSubjects: false, tierId: '', departmentId: '', stream: '', classTeacherId: '', formMasterId: '', caregiverId: '' });
        setEditIsCustomStream(false);
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
          <h1 className="text-2xl font-bold dark:text-white">Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage classes for each academic year</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!confirm('This will add missing subjects to all classes. Continue?')) return;
              setSubmitting(true);
              try {
                const res = await authFetch('/api/sms/subjects/add-missing', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ createMissingClasses: true }),
                });
                const data = await res.json();
                console.log('[ADD-MISSING] Response:', JSON.stringify(data, null, 2));
                if (res.ok) {
                  alert(`Results:\nClasses Created: ${data.classesCreated}\nSubjects Created: ${data.subjectsCreated}\n\nDebug: ${JSON.stringify(data.debug, null, 2)}`);
                  loadClasses(selectedYearId);
                } else {
                  alert('Error: ' + JSON.stringify(data));
                }
              } catch (err) {
                alert('Exception: ' + err);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!selectedYearId || submitting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300 flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Missing Subjects
          </button>
          <button
            onClick={() => { setShowModal(true); setIsCustomStream(false); setSelectedTierCode(''); }}
            disabled={!selectedYearId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600"
          >
            Add Class
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Academic Year
        </label>
        <select
          value={selectedYearId}
          onChange={(e) => setSelectedYearId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No classes yet. Add your first class for this academic year.
            </div>
          ) : (
            classes.map((cls) => {
              // Build display name: Name + Department + Stream
              const parts = [cls.name];
              if (cls.department) parts.push(cls.department.code);
              if (cls.stream && !cls.department) parts.push(cls.stream);
              if (cls.stream && cls.department) parts.push(cls.stream);
              const fullClassName = parts.join('-');
              return (
                <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg dark:text-white">{fullClassName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getLevelName(cls.level)}
                        {cls.stream && cls.department && <span className="ml-1 text-orange-600">Stream: {cls.stream}</span>}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {getLevelName(cls.level)}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Capacity: {cls.capacity}</span>
                    <span>Subjects: {cls.subjects?.length || 0}</span>
                  </div>
                  {(cls.classTeacher || cls.formMaster || cls.caregiver) && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {cls.classTeacher && <div>Teacher: {cls.classTeacher.firstName} {cls.classTeacher.lastName}</div>}
                      {cls.formMaster && <div>Form Master: {cls.formMaster.firstName} {cls.formMaster.lastName}</div>}
                      {cls.caregiver && <div>Caregiver: {cls.caregiver.firstName} {cls.caregiver.lastName}</div>}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/sms/classes/${cls.id}/subjects`}
                      className="flex-1 text-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Subjects
                    </Link>
                    <button
                      onClick={() => handleEdit(cls)}
                      className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!selectedYearId && years.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Please select an academic year to view its classes.
        </div>
      )}

      {years.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No academic years found. Please{' '}
          <Link href="/sms/academic-years" className="text-blue-600 dark:text-blue-400 hover:underline">
            create an academic year
          </Link>{' '}
          first.
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grade 10-A"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    min="1"
                  />
                </div>
              </div>

              {tiers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tier
                  </label>
                  <select
                    value={formData.tierId}
                    onChange={(e) => setFormData({ ...formData, tierId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select tier...</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {departments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department/Track
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Subject grouping for SSS (Science, Arts, Commerce, Technical)
                  </p>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stream
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Split large classes into parallel sections (A, B, C, D...)
                </p>
                <div className="relative">
                  <select
                    value={isCustomStream ? '__custom__' : (streamOptions.includes(formData.stream) ? formData.stream : '__custom__')}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomStream(true);
                        setFormData({ ...formData, stream: '' });
                      } else {
                        setIsCustomStream(false);
                        setFormData({ ...formData, stream: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white pr-8"
                  >
                    <option value="">Select stream</option>
                    {streamOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="__custom__">+ Custom Stream</option>
                  </select>
                  {isCustomStream && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.stream}
                        onChange={(e) => setFormData({ ...formData, stream: e.target.value.toUpperCase() })}
                        placeholder="Enter custom stream name"
                        className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
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
                <label htmlFor="addNerdcSubjects" className="text-sm text-gray-700 dark:text-gray-300">
                  Add subjects for {CURRICULUM_INFO[currentCurriculum as keyof typeof CURRICULUM_INFO]?.name || currentCurriculum}
                </label>
              </div>

              {formData.addNerdcSubjects && formData.level && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {(() => {
                    const level = parseInt(formData.level);
                    const dept = departments.find(d => d.id === formData.departmentId);
                    const subjects = isNaN(level) ? [] : getSubjectsByCurriculum(level, currentCurriculum, dept?.code);
                    return `Will add ${subjects.length} subjects: ${subjects.slice(0, 3).map((s) => s.name).join(', ')}...`;
                  })()}
                </div>
              )}

              {/* Care-giver - Show for Pre-Nursery (PRE_NUR) and Nursery (NUR) tiers */}
              {(selectedTierCode === 'PRE_NUR' || selectedTierCode === 'NUR') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Care-giver
                  </label>
                  <select
                    value={formData.caregiverId}
                    onChange={(e) => setFormData({ ...formData, caregiverId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No care-giver assigned</option>
                    {staff.filter(s => s.category === 'CAREGIVER').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Teacher - Show for Pre-Nursery (PRE_NUR), Nursery (NUR), and Primary (PRI) tiers */}
              {(selectedTierCode === 'PRE_NUR' || selectedTierCode === 'NUR' || selectedTierCode === 'PRI') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Teacher
                  </label>
                  <select
                    value={formData.classTeacherId}
                    onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No class teacher assigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId}){t.position ? ` - ${t.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Master - Show for JSS and SSS tiers */}
              {(selectedTierCode === 'JSS' || selectedTierCode === 'SSS') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Form Master
                  </label>
                  <select
                    value={formData.formMasterId}
                    onChange={(e) => setFormData({ ...formData, formMasterId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No form master assigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId}){t.position ? ` - ${t.position}` : ''}
                      </option>
                    ))}
                  </select>
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
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Edit Class</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Level
                  </label>
                  <select
                    value={editFormData.level}
                    onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    min="1"
                  />
                </div>
              </div>

              {tiers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tier
                  </label>
                  <select
                    value={editFormData.tierId}
                    onChange={(e) => setEditFormData({ ...editFormData, tierId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select tier...</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {departments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department/Track
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Subject grouping for SSS (Science, Arts, Commerce, Technical)
                  </p>
                  <select
                    value={editFormData.departmentId}
                    onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stream
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Split large classes into parallel sections (A, B, C, D...)
                </p>
                <div className="relative">
                  <select
                    value={editIsCustomStream ? '__custom__' : (editStreamOptions.includes(editFormData.stream) ? editFormData.stream : '__custom__')}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setEditIsCustomStream(true);
                        setEditFormData({ ...editFormData, stream: '' });
                      } else {
                        setEditIsCustomStream(false);
                        setEditFormData({ ...editFormData, stream: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white pr-8"
                  >
                    <option value="">Select stream</option>
                    {editStreamOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="__custom__">+ Custom Stream</option>
                  </select>
                  {editIsCustomStream && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editFormData.stream}
                        onChange={(e) => setEditFormData({ ...editFormData, stream: e.target.value.toUpperCase() })}
                        placeholder="Enter custom stream name"
                        className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
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
                <label htmlFor="editAddNerdcSubjects" className="text-sm text-gray-700 dark:text-gray-300">
                  Add missing subjects for {CURRICULUM_INFO[currentCurriculum as keyof typeof CURRICULUM_INFO]?.name || currentCurriculum}
                </label>
              </div>

              {editFormData.addNerdcSubjects && editFormData.level && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {(() => {
                    const level = parseInt(editFormData.level);
                    const dept = departments.find(d => d.id === editFormData.departmentId);
                    const subjects = isNaN(level) ? [] : getSubjectsByCurriculum(level, currentCurriculum, dept?.code);
                    return `Will add missing subjects from: ${subjects.slice(0, 3).map(s => s.name).join(', ')}...`;
                  })()}
                </div>
              )}

              {/* Care-giver - Show for Pre-Nursery (PRE_NUR) and Nursery (NUR) tiers */}
              {(selectedTierCode === 'PRE_NUR' || selectedTierCode === 'NUR') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Care-giver
                  </label>
                  <select
                    value={editFormData.caregiverId}
                    onChange={(e) => setEditFormData({ ...editFormData, caregiverId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No care-giver assigned</option>
                    {staff.filter(s => s.category === 'CAREGIVER').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Teacher - Show for Pre-Nursery (PRE_NUR), Nursery (NUR), and Primary (PRI) tiers */}
              {(selectedTierCode === 'PRE_NUR' || selectedTierCode === 'NUR' || selectedTierCode === 'PRI') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Teacher
                  </label>
                  <select
                    value={editFormData.classTeacherId}
                    onChange={(e) => setEditFormData({ ...editFormData, classTeacherId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No class teacher assigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId}){t.position ? ` - ${t.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Master - Show for JSS and SSS tiers */}
              {(selectedTierCode === 'JSS' || selectedTierCode === 'SSS') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Form Master
                  </label>
                  <select
                    value={editFormData.formMasterId}
                    onChange={(e) => setEditFormData({ ...editFormData, formMasterId: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No form master assigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId}){t.position ? ` - ${t.position}` : ''}
                      </option>
                    ))}
                  </select>
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
                    setEditIsCustomStream(false);
                    setSelectedTierCode('');
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
