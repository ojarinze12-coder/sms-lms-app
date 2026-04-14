'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Search, Filter } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentIdNo: string;
  className: string;
  average: number;
  grade: string;
  term: string;
  academicYear: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      loadTerms(selectedYearId);
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedTermId) {
      loadLeaderboard();
    }
  }, [selectedTermId, selectedClassId]);

  const loadYears = async () => {
    try {
      const res = await authFetch('/api/sms/academic-years');
      const data = await res.json();
      const yearList = data.years || [];
      setYears(yearList);
      if (yearList.length > 0) {
        const activeYear = yearList.find((y: any) => y.isActive);
        setSelectedYearId(activeYear?.id || yearList[0].id);
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
      if (data.length > 0) {
        setSelectedTermId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load terms:', err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTermId) params.append('termId', selectedTermId);
      if (selectedClassId) params.append('classId', selectedClassId);
      params.append('limit', '20');

      const res = await authFetch(`/api/sms/leaderboard?${params}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
    if (rank === 3) return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    return 'bg-white dark:bg-gray-800 border dark:border-gray-700';
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
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Student Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Top performing students by average score</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class (Optional)</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Classes</option>
          </select>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
            No leaderboard data available for the selected term.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leaderboard.map((entry) => (
            <Card key={entry.studentId} className={`${getRankBg(entry.rank)} border-2`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{entry.studentName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.studentIdNo} • {entry.className}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{entry.average.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Grade: {entry.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
