'use client';

import { TrendingUp, CreditCard, Calendar, Bell, FileText, Award } from 'lucide-react';

interface ParentNavProps {
  viewMode: 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards';
  onViewModeChange: (mode: 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards') => void;
  feeStats: { pending: number };
  attendanceStats: { percentage: number };
  announcementsCount: number;
  resultsCount?: number;
  reportCardsCount?: number;
}

export default function ParentNav({
  viewMode,
  onViewModeChange,
  feeStats,
  attendanceStats,
  announcementsCount,
  resultsCount = 0,
  reportCardsCount = 0,
}: ParentNavProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, badge: null, color: 'blue' },
    { id: 'fees', label: 'Fees', icon: CreditCard, badge: feeStats.pending, color: 'green' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, badge: attendanceStats.percentage, color: 'purple', isPercentage: true },
    { id: 'announcements', label: 'Announcements', icon: Bell, badge: announcementsCount, color: 'orange' },
    { id: 'results', label: 'Results', icon: FileText, badge: resultsCount, color: 'cyan' },
    { id: 'report-cards', label: 'Report Cards', icon: Award, badge: reportCardsCount, color: 'red' },
  ];

  const getColorClasses = (color: string, isActive: boolean): string => {
    const colors: Record<string, string> = {
      blue: isActive 
        ? 'bg-blue-50 dark:bg-blue-900/50 border-2 border-blue-500 dark:border-blue-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      green: isActive 
        ? 'bg-green-50 dark:bg-green-900/50 border-2 border-green-500 dark:border-green-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      purple: isActive 
        ? 'bg-purple-50 dark:bg-purple-900/50 border-2 border-purple-500 dark:border-purple-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      orange: isActive 
        ? 'bg-orange-50 dark:bg-orange-900/50 border-2 border-orange-500 dark:border-orange-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      cyan: isActive 
        ? 'bg-cyan-50 dark:bg-cyan-900/50 border-2 border-cyan-500 dark:border-cyan-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      red: isActive 
        ? 'bg-red-50 dark:bg-red-900/50 border-2 border-red-500 dark:border-red-400' 
        : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
    };
    return colors[color] || colors.blue;
  };

  const getBadgeColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      cyan: 'text-cyan-600 dark:text-cyan-400',
      red: 'text-red-600 dark:text-red-400',
    };
    return colors[color] || colors.blue;
  };

  const getBgColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/50',
      green: 'bg-green-100 dark:bg-green-900/50',
      purple: 'bg-purple-100 dark:bg-purple-900/50',
      orange: 'bg-orange-100 dark:bg-orange-900/50',
      cyan: 'bg-cyan-100 dark:bg-cyan-900/50',
      red: 'bg-red-100 dark:bg-red-900/50',
    };
    return colors[color] || colors.blue;
  };

  const handleClick = (id: string) => {
    onViewModeChange(id as 'overview' | 'fees' | 'attendance' | 'announcements' | 'results' | 'report-cards');
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = viewMode === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`p-3 rounded-xl text-left transition-all min-h-[60px] ${getColorClasses(item.color, isActive)}`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${getBgColor(item.color)}`}>
                <Icon className={`h-4 w-4 ${getBadgeColor(item.color)}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className={`text-sm font-bold ${getBadgeColor(item.color)}`}>
                  {item.isPercentage ? `${item.badge}%` : item.badge !== null ? item.badge : ''}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}