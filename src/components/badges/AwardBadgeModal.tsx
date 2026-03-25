'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BadgeData, Student } from '@/types/badge';

interface AwardBadgeModalProps {
  open: boolean;
  badges: BadgeData[];
  students: Student[];
  selectedBadge: BadgeData | null;
  onSelectBadge: (badge: BadgeData | null) => void;
  onAward: (studentId: string) => void;
  onClose: () => void;
}

export default function AwardBadgeModal({
  open,
  badges,
  students,
  selectedBadge,
  onSelectBadge,
  onAward,
  onClose,
}: AwardBadgeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle>Award Badge to Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Badge</label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-auto p-1">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => onSelectBadge(badge)}
                  className={`p-2 rounded border text-center ${
                    selectedBadge?.id === badge.id
                      ? 'bg-blue-100 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  title={badge.name}
                >
                  <div className="text-2xl">{badge.icon || '🏅'}</div>
                </button>
              ))}
            </div>
            {selectedBadge && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <strong>{selectedBadge.name}</strong> - {selectedBadge.points} points
                {!selectedBadge.isGlobal && selectedBadge.tier && (
                  <span> ({selectedBadge.tier.name})</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Student</label>
            <Select onValueChange={onAward}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
