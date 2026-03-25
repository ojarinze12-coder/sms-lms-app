'use client';

import { TrendingUp, CreditCard, Calendar, Bell } from 'lucide-react';
import { formatCurrency } from '@/types/parent';

interface ParentNavProps {
  viewMode: 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards';
  onViewModeChange: (mode: 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards') => void;
  feeStats: { pending: number };
  attendanceStats: { percentage: number };
  announcementsCount: number;
}

export default function ParentNav({
  viewMode,
  onViewModeChange,
  feeStats,
  attendanceStats,
  announcementsCount,
}: ParentNavProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, badge: null, color: 'blue' },
    { id: 'fees', label: 'Fees', icon: CreditCard, badge: feeStats.pending, color: 'green' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, badge: attendanceStats.percentage, color: 'purple', isPercentage: true },
    { id: 'announcements', label: 'Announcements', icon: Bell, badge: announcementsCount, color: 'orange' },
  ];

  const getColorClasses = (color: string, isActive: boolean): string => {
    const colors: Record<string, string> = {
      blue: isActive ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border hover:border-gray-300',
      green: isActive ? 'bg-green-50 border-2 border-green-500' : 'bg-white border hover:border-gray-300',
      purple: isActive ? 'bg-purple-50 border-2 border-purple-500' : 'bg-white border hover:border-gray-300',
      orange: isActive ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border hover:border-gray-300',
    };
    return colors[color] || colors.blue;
  };

  const getBadgeColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
    };
    return colors[color] || colors.blue;
  };

  const getBgColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
    };
    return colors[color] || colors.blue;
  };

  const handleClick = (id: string) => {
    onViewModeChange(id as 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards');
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = viewMode === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`p-4 rounded-xl text-left transition-all ${getColorClasses(item.color, isActive)}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getBgColor(item.color)}`}>
                <Icon className={`h-5 w-5 ${getBadgeColor(item.color)}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`font-bold ${getBadgeColor(item.color)}`}>
                  {item.isPercentage ? `${item.badge}%` : item.badge !== null ? formatCurrency(item.badge) : ''}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
