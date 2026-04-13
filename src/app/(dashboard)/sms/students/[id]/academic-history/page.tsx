'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download, Send } from 'lucide-react';

interface AcademicRecord {
  id: string;
  subjectId: string | null;
  subject: { name: string; code: string } | null;
  ca1Score: number | null;
  ca2Score: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradePoint: number | null;
  remarks: string | null;
  attendance: number | null;
  position: number | null;
}

interface Transcript {
  id: string;
  documentNo: string | null;
  status: string;
  generatedAt: string;
  purpose: string | null;
  sendingTo: string | null;
  pdfUrl: string | null;
}

export default function StudentAcademicHistoryPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [transcriptForm, setTranscriptForm] = useState({
    purpose: '',
    sendingTo: '',
    notes: '',
  });

useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id, selectedYear]);

  async function fetchAcademicYears() {
    try {
      const res = await authFetch('/api/sms/academic-years');
      if (res.ok) {
        const data = await res.json();
        setAcademicYears(data.years || []);
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
    }
  }

  async function fetchData() {
    setError(null);
    setLoading(true);
    try {
      const yearQuery = selectedYear && selectedYear !== 'all' ? `?academicYearId=${selectedYear}` : '';
      const url = `/api/sms/students/${params.id}/academic-records${yearQuery}`;
      console.log('[Academic History] Fetching:', url);
      
      const recordsRes = await authFetch(url);
      console.log('[Academic History] Response status:', recordsRes.status);
      
      if (!recordsRes.ok) {
        const errorText = await recordsRes.text();
        console.error('[Academic History] Error response:', errorText);
        setError(`Server error: ${recordsRes.status}`);
        setRecords([]);
        return;
      }
      
      const recordsData = await recordsRes.json();
      console.log('[Academic History] Data keys:', Object.keys(recordsData));
      
      if (recordsData.records) {
        setRecords(recordsData.records || []);
      } else {
        setRecords([]);
      }
      
      // Load transcripts if needed, or skip for now
      setTranscripts([]);
    } catch (err) {
      console.error('[Academic History] Fetch error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear]);

  async function handleGenerateTranscript(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/sms/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: params.id,
          academicYearId: selectedYear,
          ...transcriptForm,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTranscripts([data.transcript, ...transcripts]);
        setShowGenerateModal(false);
      }
    } catch (err) {
      console.error('Failed to generate transcript:', err);
    }
  }

  const calculateAverage = () => {
    const scored = records.filter(r => r.totalScore !== null);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, r) => sum + (r.totalScore || 0), 0) / scored.length;
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-100';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.786-1.246 2.786-2.786 0-1.54-1.246-2.786-2.786-2.786H6.786C5.246 14.428 4 15.674 4 17.214c0 1.54 1.246 2.786 2.786 2.786z" />
            </svg>
            <span className="font-medium">{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic History</h1>
          <p className="text-gray-500 mt-1">Student performance and transcript management</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sms/students/${params.id}`}>
            <Button variant="outline">Back to Student</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Subjects</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold">{calculateAverage().toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Transcripts Generated</p>
            <p className="text-2xl font-bold">{transcripts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subject Performance</CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No academic records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CA1</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CA2</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Exam</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(record => (
                      <tr key={record.id}>
                        <td className="px-3 py-2">{record.subject?.name || 'N/A'}</td>
                        <td className="px-3 py-2">{record.ca1Score ?? '-'}</td>
                        <td className="px-3 py-2">{record.ca2Score ?? '-'}</td>
                        <td className="px-3 py-2">{record.examScore ?? '-'}</td>
                        <td className="px-3 py-2 font-medium">{record.totalScore ?? '-'}</td>
                        <td className="px-3 py-2">
                          {record.grade && (
                            <span className={`px-2 py-1 rounded text-xs ${getGradeColor(record.grade)}`}>
                              {record.grade}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transcripts</CardTitle>
            <Button onClick={() => setShowGenerateModal(true)} size="sm">
              Generate Transcript
            </Button>
          </CardHeader>
          <CardContent>
            {transcripts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No transcripts generated</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transcripts.map(transcript => (
                  <div key={transcript.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{transcript.documentNo}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            transcript.status === 'GENERATED' ? 'bg-blue-100 text-blue-800' :
                            transcript.status === 'SENT' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transcript.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {transcript.purpose && `Purpose: ${transcript.purpose}`}
                          {transcript.sendingTo && ` • Sent to: ${transcript.sendingTo}`}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Generated: {new Date(transcript.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {transcript.pdfUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}