export interface BadgeData {
  id: string;
  name: string;
  description?: string;
  icon: string;
  criteria: any;
  points: number;
  isGlobal: boolean;
  tier?: { id: string; name: string; code: string };
  tierId?: string;
  tenantId?: string;
  isEarned?: boolean;
  earnedCount?: number;
  _count?: { students: number };
}

export interface Tier {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  points: number;
  isGlobal: boolean;
  tierId: string;
}

export const getInitialBadgeForm = (): BadgeFormData => ({
  name: '',
  description: '',
  icon: '🏆',
  points: 10,
  isGlobal: true,
  tierId: '',
});

export const BADGE_ICONS = [
  { value: '🏆', label: 'Trophy' }, { value: '🥇', label: 'Gold Medal' },
  { value: '🥈', label: 'Silver Medal' }, { value: '🥉', label: 'Bronze Medal' },
  { value: '⭐', label: 'Star' }, { value: '🌟', label: 'Glowing Star' },
  { value: '🎯', label: 'Target' }, { value: '💯', label: 'Hundred' },
  { value: '📚', label: 'Books' }, { value: '🎓', label: 'Graduate' },
  { value: '📝', label: 'Note' }, { value: '✅', label: 'Checkmark' },
  { value: '👍', label: 'Thumbs Up' }, { value: '👏', label: 'Clapping' },
  { value: '🔥', label: 'Fire' }, { value: '💪', label: 'Strong' },
  { value: '🚀', label: 'Rocket' }, { value: '💡', label: 'Lightbulb' },
  { value: '🎨', label: 'Art' }, { value: '🏅', label: 'Medal' },
  { value: '📖', label: 'Reading' }, { value: '✏️', label: 'Pencil' },
  { value: '🔬', label: 'Science' }, { value: '🧮', label: 'Math' },
  { value: '🌍', label: 'Globe' }, { value: '🎵', label: 'Music' },
  { value: '🏃', label: 'Running' }, { value: '⚽', label: 'Sports' },
  { value: '💻', label: 'Computer' }, { value: '🎮', label: 'Gaming' },
];
