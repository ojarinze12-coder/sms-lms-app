'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Clock, Loader2, Save, CheckCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher?: { firstName: string; lastName: string } | null;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
}

export default function SchoolAITimetablePage() {
  const { selectedBranch } = useBranch();
  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<any>(null);
  const [timetableName, setTimetableName] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [savedTimetableId, setSavedTimetableId] = useState<string | null>(null);
  
  // Timetable settings
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [periodDuration, setPeriodDuration] = useState(40);
  const [schoolStartTime, setSchoolStartTime] = useState("08:00");
  const [schoolEndTime, setSchoolEndTime] = useState("15:00");
  const [breakStartTime, setBreakStartTime] = useState("12:00");
  const [breakEndTime, setBreakEndTime] = useState("12:30");

  useEffect(() => {
    loadYears();
    loadTimetableSettings();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadClasses(selectedYearId);
    }
  }, [selectedYearId, selectedBranch]);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId);
    }
  }, [selectedClassId]);

  const loadTimetableSettings = async () => {
    try {
      const res = await fetch('/api/tenant/timetable-settings');
      const data = await res.json();
      if (data.daysPerWeek) setDaysPerWeek(data.daysPerWeek);
      if (data.periodDuration) setPeriodDuration(data.periodDuration);
    } catch (err) {
      console.error('Failed to load timetable settings:', err);
    }
  };

  const calculatePeriodsPerDay = () => {
    const start = parseInt(schoolStartTime.split(':')[0]) * 60 + parseInt(schoolStartTime.split(':')[1]);
    const end = parseInt(schoolEndTime.split(':')[0]) * 60 + parseInt(schoolEndTime.split(':')[1]);
    const breakStart = parseInt(breakStartTime.split(':')[0]) * 60 + parseInt(breakStartTime.split(':')[1]);
    const breakEnd = parseInt(breakEndTime.split(':')[0]) * 60 + parseInt(breakEndTime.split(':')[1]);
    const breakDuration = breakEnd - breakStart;
    const totalMinutes = end - start - breakDuration;
    return Math.floor(totalMinutes / periodDuration);
  };

const loadYears = async () => {
  try {
    const res = await authFetch('/api/sms/academic-years');
    if (!res.ok) {
      console.error('Failed to load years:', res.status);
      return;
    }
    const data = await res.json();
    const yearList = data?.years || [];
    setYears(Array.isArray(yearList) ? yearList : []);
    if (yearList.length > 0) {
      const activeYear = yearList.find((y: any) => y.isActive);
      setSelectedYearId(activeYear?.id || yearList[0].id);
    }
  } catch (err) {
    console.error('Failed to load years:', err);
    setYears([]);
  } finally {
    setLoading(false);
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedClassId || selectedSubjects.length === 0) {
      alert('Please select a class and at least one subject');
      return;
    }

    setGenerating(true);
    setGeneratedTimetable(null);
    
    try {
      const classInfo = classes.find(c => c.id === selectedClassId);
      const subjectData = subjects.filter(s => selectedSubjects.includes(s.id));
      const periodsPerDay = calculatePeriodsPerDay();
      
      const res = await authFetch('/api/ai/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: classInfo?.name || 'Class',
          subjects: subjectData.map(s => s.name),
          teachers: subjectData.map(s => s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'TBA'),
          periodsPerDay,
          daysPerWeek,
          schoolStartTime,
          schoolEndTime,
          breakStartTime,
          breakEndTime,
          periodDuration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate timetable');
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setGeneratedTimetable(data);
    } catch (err: any) {
      console.error('Failed to generate:', err);
      alert('Error: ' + (err.message || 'Failed to generate'));
    } finally {
      setGenerating(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSaveTimetable = async () => {
    if (!timetableName.trim()) {
      alert('Please enter a timetable name');
      return;
    }
    if (!generatedTimetable?.slots?.length) {
      alert('No timetable to save');
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/ai/timetable/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: timetableName,
          academicYearId: selectedYearId,
          academicClassId: selectedClassId,
          isPublished,
          slots: generatedTimetable.slots,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to save timetable');
        return;
      }

      const data = await res.json();
      setSavedTimetableId(data.id);
      alert(`Timetable saved successfully! ${isPublished ? '(Published)' : '(Draft)'}`);
    } catch (err) {
      console.error('Failed to save timetable:', err);
      alert('Error saving timetable');
    } finally {
      setSaving(false);
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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">AI Timetable Generator</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate class schedules using AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select year...</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={!selectedYearId}
                >
                  <option value="">Select class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Subjects ({selectedSubjects.length})
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2 dark:border-gray-600 dark:bg-gray-700">
                  {subjects.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No subjects found.</p>
                  ) : (
                    subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm dark:text-gray-300">{subject.name} ({subject.code})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Timetable Settings */}
              <div className="border-t pt-4 mt-4 dark:border-gray-700">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Timetable Settings</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Days/Week
                        </label>
                        <select
                          value={daysPerWeek}
                          onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={5}>5 Days</option>
                          <option value={6}>6 Days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Period (min)
                        </label>
                        <select
                          value={periodDuration}
                          onChange={(e) => setPeriodDuration(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={30}>30</option>
                          <option value={35}>35</option>
                          <option value={40}>40</option>
                          <option value={45}>45</option>
                          <option value={60}>60</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={schoolStartTime}
                          onChange={(e) => setSchoolStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={schoolEndTime}
                          onChange={(e) => setSchoolEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Break Start
                        </label>
                        <input
                          type="time"
                          value={breakStartTime}
                          onChange={(e) => setBreakStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Break End
                        </label>
                        <input
                          type="time"
                          value={breakEndTime}
                          onChange={(e) => setBreakEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Calculated: {calculatePeriodsPerDay()} periods/day
                    </p>
                  </div>
                </details>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedClassId || selectedSubjects.length === 0 || generating}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </button>

              {generatedTimetable && (
                <div className="border-t pt-4 mt-4 space-y-3 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timetable Name
                    </label>
                    <input
                      type="text"
                      value={timetableName}
                      onChange={(e) => setTimetableName(e.target.value)}
                      placeholder="e.g., JSS1 Term 1 Timetable"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveTimetable}
                    disabled={!timetableName.trim() || saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : savedTimetableId ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Timetable
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-4 dark:text-white">Generated Timetable</h3>
          
          {!generatedTimetable ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select subjects and click generate to create a timetable</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="px-2 py-2 text-left dark:text-gray-300">Period</th>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <th key={day} className="px-2 py-2 text-left dark:text-gray-300">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map(period => (
                    <tr key={period} className="border-b dark:border-gray-700">
                      <td className="px-2 py-2 font-medium dark:text-gray-300">P{period}</td>
                      {[0, 1, 2, 3, 4].map(day => {
                        const slot = generatedTimetable.slots?.find(
                          (s: any) => s.dayOfWeek === day && s.period === period
                        );
                        return (
                          <td key={day} className="px-2 py-2">
                            {slot ? (
                              <div className="text-xs">
                                <div className="font-medium dark:text-white">{slot.subject}</div>
                                <div className="text-gray-500 dark:text-gray-400">{slot.teacher}</div>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
