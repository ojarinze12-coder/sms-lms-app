'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate, type FeePayment, type Attendance, type Announcement } from '@/types/parent';

interface OverviewTabProps {
  attendanceStats: { present: number; total: number; percentage: number };
  feeStats: { total: number; paid: number; pending: number };
  announcements: Announcement[];
  onViewFees: () => void;
  onViewResults: () => void;
}

export default function OverviewTab({
  attendanceStats,
  feeStats,
  announcements,
  onViewFees,
  onViewResults,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{attendanceStats.percentage}%</div>
            <p className="text-xs text-gray-500 mt-1">{attendanceStats.present} of {attendanceStats.total} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fee Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(feeStats.pending)}</div>
            <p className="text-xs text-gray-500 mt-1">Remaining to pay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={onViewFees}>
              <CreditCard className="h-4 w-4 mr-2" /> Pay Fees
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={onViewResults}>
              <FileText className="h-4 w-4 mr-2" /> View Results
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No announcements</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{ann.title}</h4>
                    <span className="text-xs text-gray-500">{formatDate(ann.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
