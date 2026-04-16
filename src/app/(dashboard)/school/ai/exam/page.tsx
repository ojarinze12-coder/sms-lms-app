'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, X, Save, CheckCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AcademicClass {
  id: string;
  name: string;
}

interface GeneratedQuestion {
  content: string;
  type: string;
  points: number;
  options: Array<{
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
}

const EXAM_TYPES = [
  { value: 'MID_TERM', label: 'Mid Term Exam' },
  { value: 'END_TERM', label: 'End Term Exam' },
  { value: 'MOCK', label: 'Mock Exam' },
  { value: 'WAEC', label: 'WAEC' },
  { value: 'NECO', label: 'NECO' },
  { value: 'JAMB_UTME', label: 'JAMB UTME' },
  { value: 'BECE', label: 'BECE (JSS3)' },
  { value: 'ASSIGNMENT', label: 'Continuous Assessment (CASS)' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'PRACTICE', label: 'Practice Exam' },
];

export default function SchoolAIExamPage() {
  const { selectedBranch } = useBranch();
  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [examType, setExamType] = useState('MID_TERM');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [savedExamId, setSavedExamId] = useState<string | null>(null);

  useEffect(() => {
    loadYears();
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
      console.error('[loadYears] Error:', err);
      setYears([]);
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
    
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    if (!selectedSubject || !topic) {
      alert('Please select a subject and enter a topic');
      return;
    }

    setGenerating(true);
    setQuestions([]);
    
    try {
      const res = await authFetch('/api/ai/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject: selectedSubject.name,
          difficulty,
          numQuestions,
          questionType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate questions');
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error('Failed to generate:', err);
      alert('Error: ' + (err.message || 'Failed to generate'));
    } finally {
      setGenerating(false);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim()) {
      alert('Please enter an exam title');
      return;
    }
    if (questions.length === 0) {
      alert('No questions to save');
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/ai/exam/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          description: topic,
          examType,
          subjectId: selectedSubjectId,
          academicClassId: selectedClassId,
          questions: questions.map((q, i) => ({
            content: q.content,
            type: q.type,
            points: q.points,
            options: q.options.map((opt, j) => ({
              content: opt.content,
              isCorrect: opt.isCorrect,
              order: j + 1,
            })),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to save exam');
        return;
      }

      const data = await res.json();
      setSavedExamId(data.id);
      alert(`Exam saved successfully! (ID: ${data.id})`);
    } catch (err) {
      console.error('Failed to save exam:', err);
      alert('Error saving exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">AI Exam Generator</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate exam questions using AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-4 dark:text-white">Exam Configuration</h3>
            
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSubjectId('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={!selectedClassId}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exam Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {EXAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Topic / Description
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Algebra - Linear equations, quadratic formulas"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                  min={1}
                  max={50}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedSubjectId || !topic || generating}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </button>

              {questions.length > 0 && (
                <div className="border-t pt-4 mt-4 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exam Title
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Enter exam title..."
                    className="w-full px-3 py-2 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveExam}
                    disabled={!examTitle.trim() || saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Exam...
                      </>
                    ) : savedExamId ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Exam Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Exam
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <h3 className="font-semibold mb-4 dark:text-white">
            Generated Questions ({questions.length})
          </h3>
          
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select exam details and click generate to create questions</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {questions.map((q, index) => (
                <div key={index} className="border rounded-lg p-4 dark:border-gray-600 dark:bg-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-white">Q{index + 1}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 rounded">
                        {q.type === 'MULTIPLE_CHOICE' ? 'MCQ' : 'T/F'}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                        {q.points} pt
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {EXAM_TYPES.find(t => t.value === examType)?.label || 'Class Exam'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm mb-3 dark:text-gray-300">{q.content}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          opt.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt.content}
                        {opt.isCorrect && ' ✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
