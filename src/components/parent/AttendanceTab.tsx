'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDate, getAttendanceColor, type Attendance } from '@/types/parent';

interface AttendanceTabProps {
  attendances: Attendance[];
  attendanceStats: { present: number; absent: number; late: number; percentage: number };
}

export default function AttendanceTab({ attendances, attendanceStats }: AttendanceTabProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Calendar className="h-5 w-5" /> Attendance Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="p-2 md:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{attendanceStats.present}</p>
            <p className="text-xs md:text-sm text-green-700 dark:text-green-300">Present</p>
          </div>
          <div className="p-2 md:p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
            <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{attendanceStats.absent}</p>
            <p className="text-xs md:text-sm text-red-700 dark:text-red-300">Absent</p>
          </div>
          <div className="p-2 md:p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-center">
            <p className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendanceStats.late}</p>
            <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">Late</p>
          </div>
          <div className="p-2 md:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
            <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats.percentage}%</p>
            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300">Rate</p>
          </div>
        </div>
        {attendances.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No attendance records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[350px]">
              <thead className="border-b dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-2 whitespace-nowrap dark:text-gray-300">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((att) => (
                  <tr key={att.id} className="border-b dark:border-gray-700">
                    <td className="py-3 px-2 whitespace-nowrap dark:text-gray-300">{formatDate(att.date)}</td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getAttendanceColor(att.status)}`}>{att.status}</span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{att.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}