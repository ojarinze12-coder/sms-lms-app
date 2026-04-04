'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Search, FileText, User, Settings, CreditCard, Shield } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  userId: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', entityType: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [filter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.search) params.set('search', filter.search);
      if (filter.entityType) params.set('entityType', filter.entityType);
      params.set('page', page.toString());
      
      const res = await fetch(`/api/sms/audit?${params}`);
      
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        setLogs([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      if (data.error) {
        console.error('API error:', data.error);
        setLogs([]);
      } else {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      }
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (entityType: string | null) => {
    switch (entityType) {
      case 'STUDENT': return <User className="h-4 w-4" />;
      case 'TEACHER': return <User className="h-4 w-4" />;
      case 'STAFF': return <User className="h-4 w-4" />;
      case 'INVOICE': return <CreditCard className="h-4 w-4" />;
      case 'SETTINGS': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityBadge = (entityType: string | null) => {
    const colors: Record<string, string> = {
      STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      TEACHER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      STAFF: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      FEE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      INVOICE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      ATTENDANCE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
      EXAM: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      COURSE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      SETTINGS: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    const color = colors[entityType || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {entityType || 'General'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Audit Log</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track all activities within your school</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <Select
              value={filter.entityType || 'all'}
              onValueChange={(val) => setFilter({ ...filter, entityType: val === 'all' ? '' : val })}
            >
              <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all" className="dark:text-gray-300">All Types</SelectItem>
                <SelectItem value="STUDENT" className="dark:text-gray-300">Student</SelectItem>
                <SelectItem value="TEACHER" className="dark:text-gray-300">Teacher</SelectItem>
                <SelectItem value="STAFF" className="dark:text-gray-300">Staff</SelectItem>
                <SelectItem value="FEE" className="dark:text-gray-300">Fee</SelectItem>
                <SelectItem value="INVOICE" className="dark:text-gray-300">Invoice</SelectItem>
                <SelectItem value="ATTENDANCE" className="dark:text-gray-300">Attendance</SelectItem>
                <SelectItem value="EXAM" className="dark:text-gray-300">Exam</SelectItem>
                <SelectItem value="COURSE" className="dark:text-gray-300">Course</SelectItem>
                <SelectItem value="SETTINGS" className="dark:text-gray-300">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Time</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Action</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Description</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.entityType)}
                            <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getEntityBadge(log.entityType)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[250px] truncate">
                          {log.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}