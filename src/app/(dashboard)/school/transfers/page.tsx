'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TransferType = 'students' | 'teachers' | 'staff';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  branch: { id: string; name: string; code: string } | null;
}

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  branch: { id: string; name: string; code: string } | null;
}

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  branch: { id: string; name: string; code: string } | null;
}

export default function TransfersPage() {
  const { selectedBranch, branches } = useBranch();
  const [transferType, setTransferType] = useState<TransferType>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [transferType, selectedBranch]);

  const fetchData = async () => {
    setLoading(true);
    setSelectedIds([]);
    setResult(null);
    
    const params = new URLSearchParams();
    if (selectedBranch?.id) {
      params.set('branchId', selectedBranch.id);
    }

    try {
      if (transferType === 'students') {
        params.set('status', 'ACTIVE');
        const res = await authFetch(`/api/sms/students?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } else if (transferType === 'teachers') {
        const res = await authFetch(`/api/sms/teachers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data || []);
        }
      } else if (transferType === 'staff') {
        const res = await authFetch(`/api/sms/staff?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStaff(data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (transferType) {
      case 'students': return students;
      case 'teachers': return teachers;
      case 'staff': return staff;
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const data = getCurrentData();
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const handleBulkTransfer = async () => {
    if (!targetBranchId || selectedIds.length === 0) return;
    
    setTransferring(true);
    setResult(null);
    
    try {
      let res;
      if (transferType === 'students') {
        res = await authFetch('/api/sms/students/transfer-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentIds: selectedIds,
            targetBranchId,
            reason,
          }),
        });
      } else if (transferType === 'teachers') {
        res = await authFetch('/api/sms/teachers/transfer-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherIds: selectedIds,
            targetBranchId,
            reason,
          }),
        });
      } else {
        res = await authFetch('/api/sms/staff/transfer-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffIds: selectedIds,
            targetBranchId,
            reason,
          }),
        });
      }
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      setResult({ success: false, error: 'Transfer failed' });
    } finally {
      setTransferring(false);
    }
  };

  const currentData = getCurrentData();
  const availableBranches = branches.filter(b => b.id !== selectedBranch?.id);
  const currentBranch = branches.find(b => b.id === selectedBranch?.id);

  const getName = (item: any) => `${item.firstName} ${item.lastName}`;
  const getId = (item: any) => item.studentId || item.employeeId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Transfers</h1>
          <p className="text-gray-500">Transfer students, teachers, and staff between branches</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['students', 'teachers', 'staff'] as TransferType[]).map((type) => (
          <button
            key={type}
            onClick={() => setTransferType(type)}
            className={`px-4 py-2 rounded-lg capitalize ${
              transferType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Current Branch: {currentBranch?.name || 'All Branches'}</h2>
                <p className="text-sm text-gray-500">{currentData.length} {transferType}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.length === currentData.length && currentData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm">Select All</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No {transferType} found in this branch</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 w-10"></th>
                      <th className="text-left p-2">
                        {transferType === 'students' ? 'Student ID' : 'Employee ID'}
                      </th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Current Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-2">{getId(item)}</td>
                        <td className="p-2">{getName(item)}</td>
                        <td className="p-2">{item.branch?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <h2 className="font-semibold mb-4">Transfer {transferType}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Branch</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                >
                  <option value="">Select branch...</option>
                  {availableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for transfer"
                />
              </div>

              <div className="text-sm text-gray-500">
                {selectedIds.length} {transferType.slice(0, -1)}(s) selected
              </div>

              <Button 
                onClick={handleBulkTransfer} 
                disabled={!targetBranchId || selectedIds.length === 0 || transferring}
                className="w-full"
              >
                {transferring ? 'Transferring...' : `Transfer ${selectedIds.length} ${transferType.slice(0, -1)}(s)`}
              </Button>

              {result && (
                <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {result.results && (
                    <>
                      <p>Success: {result.results.success}</p>
                      <p>Failed: {result.results.failed}</p>
                      <p>Skipped: {result.results.skipped}</p>
                    </>
                  )}
                  {!result.results && result.error && (
                    <p>{result.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How Transfers Work</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Select {transferType} from the list</li>
              <li>• Choose target branch</li>
              <li>• Transfer validates based on settings</li>
              <li>• All transfers are logged in audit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}