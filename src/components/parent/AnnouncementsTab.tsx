'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { formatDate, type Announcement } from '@/types/parent';

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

export default function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Bell className="h-5 w-5" /> School Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No announcements</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold dark:text-white">{ann.title}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs dark:text-gray-200 ${ann.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {ann.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {ann.type}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{ann.content}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(ann.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}