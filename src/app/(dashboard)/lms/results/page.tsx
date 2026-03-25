'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resultsApi, examApi } from '@/lib/api';
import { Result } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  BookOpen, 
  Clock, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const statusColors: Record<string, string> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'warning',
  SUBMITTED: 'info',
  GRADED: 'success',
};

export default function ResultsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    examId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resultsData, examsData] = await Promise.all([
        resultsApi.list(),
        examApi.list().catch(() => []),
      ]);
      setResults(resultsData);
      setExams(examsData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load results',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filters.examId && filters.examId !== 'all' && result.examId !== filters.examId) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <Badge variant="success">Graded</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">Submitted</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">View your exam results and grades</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.examId}
              onValueChange={(value) => setFilters({ ...filters, examId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.exam?.title || '-'}
                    </TableCell>
                    <TableCell>{result.exam?.subject?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {result.exam?.examType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.submittedAt
                        ? new Date(result.submittedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-right">
                      {result.percentage !== null && result.percentage !== undefined ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">
                            {result.percentage.toFixed(1)}%
                          </span>
                          {result.status === 'GRADED' && (
                            <span className="text-muted-foreground">
                              ({result.score} pts)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/lms/results/${result.id}`}>
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
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
