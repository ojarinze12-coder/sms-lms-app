'use client';

import { Badge } from '@/components/ui/badge';
import type { BadgeData } from '@/types/badge';

interface BadgeCardProps {
  badge: BadgeData;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 text-center hover:shadow-md transition-shadow dark:border-gray-700 ${
        badge.isEarned ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'
      } ${!badge.isGlobal && badge.tier ? 'border-l-4 border-l-purple-500' : ''}`}
    >
      <div className="text-4xl mb-2">{badge.icon || '🏅'}</div>
      <h3 className="font-bold text-sm dark:text-white">{badge.name}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
      <div className="mt-2 flex justify-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {badge.points} pts
        </Badge>
        {!badge.isGlobal && badge.tier && (
          <Badge variant="secondary" className="text-xs">
            {badge.tier.name}
          </Badge>
        )}
        {badge.isEarned && (
          <Badge variant="success" className="text-xs">Earned</Badge>
        )}
      </div>
    </div>
  );
}
