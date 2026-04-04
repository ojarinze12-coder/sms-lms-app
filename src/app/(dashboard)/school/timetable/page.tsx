'use client';

import { useEffect, useState } from 'react';

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  academicClassId: string;
  subjectId: string;
  teacherId: string;
  subject?: Subject;
  teacher?: Teacher;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    period: 1,
    startTime: '08:00',
    endTime: '08:40',
    subjectId: '',
    teacherId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        fetch('/api/school/classes'),
        fetch('/api/sms/subjects'),
        fetch('/api/sms/teachers'),
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
        if (data.classes?.length > 0) setSelectedClass(data.classes[0].id);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        // Handle both { data: [] } and { subjects: [] } response formats
        const subjectsList = data.data || data.subjects || [];
        setSubjects(subjectsList);
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        // Handle both { data: [] } and { teachers: [] } response formats
        const teachersList = data.data || data.teachers || [];
        setTeachers(teachersList);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async (classId: string) => {
    try {
      const res = await fetch(`/api/school/timetable?classId=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/school/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          academicClassId: selectedClass,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingSlot(null);
        fetchTimetable(selectedClass);
      }
    } catch (err) {
      console.error('Failed to save slot:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Delete this timetable slot?')) return;
    
    try {
      const res = await fetch(`/api/school/timetable?id=${slotId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTimetable(selectedClass);
      }
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      period: slot.period,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
    });
    setShowModal(true);
  };

  const getSlotForCell = (day: number, period: number) => {
    return slots.find(s => s.dayOfWeek === day && s.period === period);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timetable Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage class schedules and timetables</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingSlot(null);
              setFormData({
                dayOfWeek: 0,
                period: 1,
                startTime: '08:00',
                endTime: '08:40',
                subjectId: '',
                teacherId: '',
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Slot
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Period</th>
                {DAYS.map((day, idx) => (
                  <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {PERIODS.map(period => (
                <tr key={period} className="dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Period {period}</td>
                  {DAYS.map((_, dayIdx) => {
                    const slot = getSlotForCell(dayIdx, period);
                    return (
                      <td key={dayIdx} className="px-2 py-2">
                        {slot ? (
                          <div 
                            className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            onClick={() => openEditModal(slot)}
                          >
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{slot.subject?.name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{slot.startTime} - {slot.endTime}</p>
                            <p className="text-xs text-blue-500 dark:text-blue-400">{slot.teacher?.firstName} {slot.teacher?.lastName}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setFormData(prev => ({ ...prev, dayOfWeek: dayIdx, period }));
                              setShowModal(true);
                            }}
                            className="w-full p-2 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-500 dark:hover:text-gray-300 text-sm"
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {DAYS.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                    {PERIODS.map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {editingSlot && (
                <button
                  onClick={() => handleDelete(editingSlot.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.subjectId}
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
