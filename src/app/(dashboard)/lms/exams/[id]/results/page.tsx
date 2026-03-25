'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examApi } from '@/lib/api';
import { Exam, Result } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const examId = params.id as string;

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examData, resultsData] = await Promise.all([
        examApi.get(examId),
        examApi.getExamResults(examId),
      ]);
      setExam(examData);
      setResults(resultsData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load results',
      });
      router.push('/lms/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    try {
      const result = await examApi.grade(examId);
      toast({
        title: 'Success',
        description: `Graded ${result.gradedCount} submissions`,
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) return null;

  const gradedResults = results.filter(r => r.status === 'GRADED');
  const avgScore = gradedResults.length > 0
    ? gradedResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / gradedResults.length
    : 0;
  const passCount = gradedResults.filter(r => (r.percentage || 0) >= 50).length;
  const totalPoints = exam.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-muted-foreground">
            {exam.subject?.name} • {exam.term?.name}
          </p>
        </div>
        <Button onClick={handleGrade}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Auto-Grade All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{results.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Graded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{gradedResults.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{avgScore.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pass Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {gradedResults.length > 0
                  ? ((passCount / gradedResults.length) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
          <CardDescription>
            {results.length} student{results.length !== 1 ? 's' : ''} submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No submissions yet
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result, index) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.status === 'GRADED' ? (
                        <div className="flex items-center gap-1">
                          {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                          {index + 1}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {result.student?.firstName} {result.student?.lastName}
                    </TableCell>
                    <TableCell>{result.student?.studentId || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          result.status === 'GRADED'
                            ? 'success'
                            : result.status === 'SUBMITTED'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.submittedAt
                        ? new Date(result.submittedAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.score !== null ? (
                        `${result.score} / ${totalPoints}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.percentage !== null ? (
                        <span
                          className={
                            (result.percentage || 0) >= 50
                              ? 'text-green-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {result.percentage.toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
