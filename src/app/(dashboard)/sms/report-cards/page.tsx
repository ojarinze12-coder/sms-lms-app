'use client';

import { useEffect, useState, useRef } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Term {
  id: string;
  name: string;
  academic_years: { id: string; name: string };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface ReportCard {
  id: string;
  termId: string;
  studentId: string;
  totalScore: number;
  average: number;
  grade: string;
  rank: number | null;
  attendance: number | null;
  remarks: string | null;
  term: Term;
  student: Student;
}

export default function ReportCardsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'generate' | 'view'>('generate');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadTerms(selectedYearId);
      loadStudents();
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedTermId) {
      loadReportCards();
    }
  }, [selectedTermId]);

  const loadYears = async () => {
    try {
      const res = await authFetch('/api/sms/academic-years');
      const data = await res.json();
      setYears(data);
      if (data.length > 0) {
        const activeYear = data.find((y: any) => y.isActive);
        setSelectedYearId(activeYear?.id || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load years:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async (yearId: string) => {
    try {
      const res = await authFetch(`/api/sms/terms?academicYearId=${yearId}`);
      const data = await res.json();
      setTerms(data);
    } catch (err) {
      console.error('Failed to load terms:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await authFetch('/api/sms/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadReportCards = async () => {
    try {
      const res = await authFetch(`/api/sms/report-cards?termId=${selectedTermId}`);
      const data = await res.json();
      setReportCards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load report cards:', err);
      setReportCards([]);
    }
  };

  const handleExportPDF = async (card: ReportCard) => {
    setSelectedReportCard(card);
    setShowPrintView(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerate = async () => {
    if (!selectedTermId || selectedStudents.length === 0) return;
    
    setGenerating(true);
    try {
      const res = await authFetch('/api/sms/report-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termId: selectedTermId,
          studentIds: selectedStudents,
        }),
      });

      if (res.ok) {
        loadReportCards();
        setSelectedStudents([]);
        alert('Report cards generated successfully!');
      }
    } catch (err) {
      console.error('Failed to generate report cards:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
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
          <h1 className="text-2xl font-bold dark:text-white">Report Cards</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and view student report cards</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('generate')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Generate
          </button>
          <button
            onClick={() => setViewMode('view')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Academic Year
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => {
              setSelectedYearId(e.target.value);
              setSelectedTermId('');
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
            Select Term
          </label>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            disabled={!selectedYearId}
          >
            <option value="">Select a term...</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Mode */}
      {viewMode === 'generate' && selectedTermId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Select Students to Generate Report Cards</h2>
          
          <div className="mb-4">
            <button
              onClick={() => {
                if (selectedStudents.length === students.length) {
                  setSelectedStudents([]);
                } else {
                  setSelectedStudents(students.map(s => s.id));
                }
              }}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border dark:border-gray-700 rounded-lg">
            {students.length === 0 ? (
              <p className="p-4 text-gray-500 dark:text-gray-400">No students found.</p>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4"
                    />
                    <span className="dark:text-white">
                      {student.firstName} {student.lastName} ({student.studentId})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={selectedStudents.length === 0 || generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : `Generate Report Cards (${selectedStudents.length})`}
            </button>
          </div>
        </div>
      )}

      {/* View Mode */}
      {viewMode === 'view' && selectedTermId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Student ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Total Score</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Average</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Grade</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {reportCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No report cards found for this term.
                  </td>
                </tr>
              ) : (
                reportCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm dark:text-white">{card.student?.studentId}</td>
                    <td className="px-6 py-4 text-sm font-medium dark:text-white">
                      {card.student?.firstName} {card.student?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-white">{card.totalScore?.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm dark:text-white">{card.average?.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(card.grade)}`}>
                        {card.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-white">{card.rank || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        className="text-blue-600 hover:underline mr-3 dark:text-blue-400"
                        onClick={() => handleExportPDF(card)}
                      >
                        View
                      </button>
                      <button 
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => handleExportPDF(card)}
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedTermId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Please select an academic year and term to {viewMode === 'generate' ? 'generate' : 'view'} report cards.
        </div>
      )}

      {showPrintView && selectedReportCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Report Card</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPrintView(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6" id="printable-report">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">SCHOOL REPORT CARD</h1>
                <p className="text-gray-600 dark:text-gray-400">{selectedReportCard.term?.academic_years?.name} - {selectedReportCard.term?.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student Name</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.student?.firstName} {selectedReportCard.student?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student ID</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.student?.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Score</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.totalScore?.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.average?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Grade</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rank</p>
                  <p className="font-medium dark:text-white">{selectedReportCard.rank || 'N/A'}</p>
                </div>
                {selectedReportCard.attendance !== null && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Attendance</p>
                    <p className="font-medium dark:text-white">{selectedReportCard.attendance}%</p>
                  </div>
                )}
                {selectedReportCard.remarks && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Remarks</p>
                    <p className="font-medium dark:text-white">{selectedReportCard.remarks}</p>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
