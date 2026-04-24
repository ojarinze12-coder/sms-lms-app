'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw,
  UserPlus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const APPROVE_URL = String.raw`/api/sms/parents/approve`;

interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimaryContact: boolean;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  student: {
    studentId: string;
    firstName: string;
    lastName: string;
  };
}

export default function ParentsPage() {
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await authFetch(APPROVE_URL);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await authFetch(APPROVE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' })
      });
      
      if (res.ok) {
        toast.success('Parent link approved successfully');
        fetchLinks();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to approve');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await authFetch(APPROVE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' })
      });
      
      if (res.ok) {
        toast.success('Parent link rejected');
        fetchLinks();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to reject');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.parent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.parent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || link.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = links.filter(l => l.approvalStatus === 'PENDING').length;
  const approvedCount = links.filter(l => l.approvalStatus === 'APPROVED').length;
  const rejectedCount = links.filter(l => l.approvalStatus === 'REJECTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Parent Links</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage parent-student linking requests</p>
        </div>
        <Button variant="outline" onClick={fetchLinks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{links.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Link Requests</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p>No link requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Parent</TableHead>
                  <TableHead className="dark:text-gray-300">Student</TableHead>
                  <TableHead className="dark:text-gray-300">Relationship</TableHead>
                  <TableHead className="dark:text-gray-300">Primary Contact</TableHead>
                  <TableHead className="dark:text-gray-300">Status</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id} className="dark:border-gray-700">
                    <TableCell>
                      <div>
                        <p className="font-medium dark:text-white">{link.parent.firstName} {link.parent.lastName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{link.parent.email}</p>
                        {link.parent.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{link.parent.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium dark:text-white">{link.student.firstName} {link.student.lastName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{link.student.studentId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{link.relationship}</TableCell>
                    <TableCell className="dark:text-gray-300">{link.isPrimaryContact ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {link.approvalStatus === 'PENDING' && (
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Clock className="h-4 w-4" /> Pending
                        </span>
                      )}
                      {link.approvalStatus === 'APPROVED' && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" /> Approved
                        </span>
                      )}
                      {link.approvalStatus === 'REJECTED' && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" /> Rejected
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {link.approvalStatus === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                            onClick={() => handleApprove(link.id)}
                            disabled={actionLoading === link.id}
                          >
                            {actionLoading === link.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() => handleReject(link.id)}
                            disabled={actionLoading === link.id}
                          >
                            {actionLoading === link.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
