'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate, type Announcement } from '@/types/parent';

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
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 md:p-6">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats.percentage}%</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{attendanceStats.present}/{attendanceStats.total} days</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 md:p-6">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Fee Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(feeStats.pending)}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remaining</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700 p-4 md:p-6">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <Button variant="outline" className="w-full justify-start h-11 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onViewFees}>
              <CreditCard className="h-4 w-4 mr-2" /> Pay Fees
            </Button>
            <Button variant="outline" className="w-full justify-start h-11 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onViewResults}>
              <FileText className="h-4 w-4 mr-2" /> View Results
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="dark:text-white">Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {announcements.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No announcements</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-medium dark:text-white">{ann.title}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(ann.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}