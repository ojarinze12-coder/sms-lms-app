'use client';

import { Home, User, FileText, Calendar, CreditCard, Bell, Award, BookOpen, MessageSquare, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string | null;
  isPercentage?: boolean;
}

interface MobileBottomNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const colorMap: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', activeBg: 'bg-blue-600', activeText: 'text-white' },
  green: { bg: 'bg-green-100', text: 'text-green-600', activeBg: 'bg-green-600', activeText: 'text-white' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', activeBg: 'bg-purple-600', activeText: 'text-white' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', activeBg: 'bg-orange-600', activeText: 'text-white' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', activeBg: 'bg-cyan-600', activeText: 'text-white' },
  red: { bg: 'bg-red-100', text: 'text-red-600', activeBg: 'bg-red-600', activeText: 'text-white' },
};

const defaultColors: Record<string, string> = {
  overview: 'blue',
  fees: 'green',
  attendance: 'purple',
  announcements: 'orange',
  results: 'cyan',
  'report-cards': 'red',
  courses: 'blue',
  assignments: 'green',
  timetable: 'purple',
  exams: 'orange',
};

export default function MobileBottomNav({ tabs, activeTab, onTabChange }: MobileBottomNavProps) {
  const getColor = (tabId: string) => {
    const colorKey = defaultColors[tabId] || 'blue';
    return colorMap[colorKey] || colorMap.blue;
  };

  return (
    <>
      {/* Mobile Bottom Navigation - visible on small screens, hidden on md and above */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colors = getColor(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center h-full min-w-0
                  transition-colors duration-150
                  ${isActive 
                    ? `${colors.activeBg} ${colors.activeText}` 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }
                `}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 && !isActive && (
                    <span className={`absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                      {typeof tab.badge === 'number' && tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet Horizontal Navigation - visible on md and above */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colors = getColor(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  p-3 rounded-xl text-left transition-all min-h-[60px]
                  ${isActive 
                    ? `dark:${colors.activeBg}/50 border-2 border-${tab.id === 'overview' ? 'blue' : tab.id === 'fees' ? 'green' : tab.id === 'attendance' ? 'purple' : tab.id === 'announcements' ? 'orange' : tab.id === 'results' ? 'cyan' : 'blue'}-500 dark:border-${tab.id === 'overview' ? 'blue' : tab.id === 'fees' ? 'green' : tab.id === 'attendance' ? 'purple' : tab.id === 'announcements' ? 'orange' : tab.id === 'results' ? 'cyan' : 'blue'}-400` 
                    : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${colors.bg} dark:${colors.bg}/50`}>
                    <Icon className={`h-4 w-4 ${colors.text} dark:${colors.text}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tab.label}</p>
                    <p className={`text-sm font-bold ${colors.text} dark:${colors.text}`}>
                      {tab.isPercentage ? `${tab.badge}%` : tab.badge !== null && tab.badge !== undefined ? tab.badge : ''}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface MobileTabNavProps {
  tabs: { id: string; label: string; icon?: React.ElementType }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileTabNav({ tabs, activeTab, onTabChange, className = '' }: MobileTabNavProps) {
  return (
    <>
      {/* Mobile Tab Bar - scrollable horizontal */}
      <div className="md:hidden overflow-x-auto border-b dark:border-gray-700 -mx-2 px-2">
        <div className="flex gap-1 min-w-max py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-colors min-h-[44px]
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {Icon && <Icon className="h-4 w-4 inline mr-1.5" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Pills - horizontal nav */}
      <div className={`hidden md:flex flex-wrap gap-2 ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
                transition-colors min-h-[44px]
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              {Icon && <Icon className="h-4 w-4 inline mr-1.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}