'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Exam } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Clock, 
  Users,
  Eye,
  Pencil,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const examTypeLabels: Record<string, string> = {
  QUIZ: 'Quiz',
  MID_TERM: 'Mid Term',
  END_TERM: 'End Term',
  ASSIGNMENT: 'Assignment',
  PRACTICE: 'Practice',
  WAEC: 'WAEC',
  NECO: 'NECO',
  BECE: 'BECE',
  JAMB_UTME: 'JAMB UTME',
  MOCK: 'Mock Exam',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ExamsPage() {
  const { toast } = useToast();
  const { user, role, loading: authLoading, isAdmin, isTeacher, isStudent } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading) {
      loadExams();
    }
  }, [authLoading]);

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lms/exams');
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load exams');
        return;
      }
      
      setExams(data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (search && !exam.title?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            {isStudent ? 'Available Exams' : isTeacher ? 'My Exams' : 'Exams'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isStudent ? 'View and take available exams' : isTeacher ? 'Manage your exams' : 'Manage all exams'}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <Link
            href="/lms/exams/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isStudent ? 'No exams available at the moment.' : 'No exams created yet.'}
          </p>
          {(isAdmin || isTeacher) && (
            <Link
              href="/lms/exams/new"
              className="text-blue-600 hover:underline"
            >
              Create your first exam
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg dark:text-white">{exam.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[exam.status || 'DRAFT']}`}>
                    {exam.status || 'DRAFT'}
                  </span>
                </div>
                <CardDescription className="dark:text-gray-400">
                  {exam.examType ? examTypeLabels[exam.examType] : 'Quiz'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{exam.duration || 60} minutes</span>
                  </div>
                  {exam.subject && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <BookOpen className="h-4 w-4" />
                      <span>{typeof exam.subject === 'object' ? exam.subject.name : 'N/A'}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {isStudent ? (
                    <Link
                      href={`/lms/exams/${exam.id}/take`}
                      className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-sm"
                    >
                      Take Exam
                    </Link>
                  ) : (
                    <Link
                      href={`/lms/exams/${exam.id}`}
                      className="flex-1 text-center px-3 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-sm"
                    >
                      View
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
