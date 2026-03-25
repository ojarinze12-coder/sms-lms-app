'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { formatDate, type Announcement } from '@/types/parent';

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

export default function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> School Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No announcements</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{ann.title}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${ann.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {ann.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      {ann.type}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{ann.content}</p>
                <p className="text-xs text-gray-400">{formatDate(ann.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
