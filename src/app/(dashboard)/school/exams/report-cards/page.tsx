'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Term {
  id: string;
  name: string;
  academicYear: { name: string };
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface ReportCardData {
  student: Student;
  totalScore: number;
  average: number;
  grade: string;
  rank: number;
  attendance: number;
  remarks: string;
  subjects: { name: string; score: number; grade: string }[];
}

export default function ReportCardBuilderPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [reportCards, setReportCards] = useState<ReportCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ReportCardData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [termsRes, classesRes] = await Promise.all([
        fetch('/api/sms/terms'),
        fetch('/api/school/classes'),
      ]);

      if (termsRes.ok) {
        const data = await termsRes.json();
        setTerms(data.terms || []);
        if (data.terms?.length > 0) setSelectedTerm(data.terms[0].id);
      }
      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
        if (data.classes?.length > 0) setSelectedClass(data.classes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const generateReportCards = async () => {
    if (!selectedTerm || !selectedClass) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/school/report-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId: selectedTerm, classId: selectedClass }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportCards(data.reportCards || []);
      }
    } catch (err) {
      console.error('Failed to generate report cards:', err);
    } finally {
      setGenerating(false);
    }
  };

  const viewReportCard = async (studentId: string) => {
    try {
      const res = await fetch(`/api/school/report-cards/${studentId}?termId=${selectedTerm}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedStudent(data.reportCard);
      }
    } catch (err) {
      console.error('Failed to fetch report card:', err);
    }
  };

  const exportPDF = async (studentId: string) => {
    try {
      const res = await fetch(`/api/school/report-cards/${studentId}/export?termId=${selectedTerm}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card Builder</h1>
          <p className="text-gray-500 mt-1">Generate and manage student report cards</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg min-w-[200px]"
            >
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name} - {t.academicYear.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg min-w-[200px]"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateReportCards}
            disabled={generating || !selectedTerm || !selectedClass}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Report Cards'}
          </button>
        </div>
      </div>

      {reportCards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Generated Report Cards ({reportCards.length})</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Average</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Grade</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Attendance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportCards.map((rc) => (
                <tr key={rc.student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {rc.student.firstName} {rc.student.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{rc.student.studentId}</td>
                  <td className="px-4 py-3">{rc.totalScore}</td>
                  <td className="px-4 py-3">{rc.average.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      rc.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                      rc.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                      rc.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {rc.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">#{rc.rank}</td>
                  <td className="px-4 py-3">{rc.attendance}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewReportCard(rc.student.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => exportPDF(rc.student.id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Export PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Report Card</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="border-b pb-4 mb-4">
              <h3 className="text-lg font-semibold">
                {selectedStudent.student.firstName} {selectedStudent.student.lastName}
              </h3>
              <p className="text-gray-500">ID: {selectedStudent.student.studentId}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-2xl font-bold">{selectedStudent.average.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-2xl font-bold">{selectedStudent.grade}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Rank</p>
                <p className="text-2xl font-bold">#{selectedStudent.rank}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Subject Results</h4>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Subject</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedStudent.subjects.map((sub, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{sub.name}</td>
                      <td className="px-3 py-2 text-right">{sub.score}</td>
                      <td className="px-3 py-2 text-right">{sub.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Teacher&apos;s Remarks</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedStudent.remarks || 'No remarks'}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => exportPDF(selectedStudent.student.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
