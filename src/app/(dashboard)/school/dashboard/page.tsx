'use client';

import { useEffect, useState } from 'react';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  revenue: number;
  attendance: number;
  feesCollected: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export default function SchoolDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    classes: 0,
    revenue: 0,
    attendance: 0,
    feesCollected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch('/api/school/dashboard', {
          credentials: 'include',
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to fetch dashboard data');
          return;
        }
        const data = await res.json();
        setStats(data.stats || stats);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to fetch dashboard data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: '👨‍🎓', color: 'blue' },
    { label: 'Teachers', value: stats.teachers, icon: '👨‍🏫', color: 'green' },
    { label: 'Classes', value: stats.classes, icon: '🏫', color: 'purple' },
    { label: 'Avg. Attendance', value: `${stats.attendance}%`, icon: '✅', color: 'orange' },
    { label: 'Fees Collected', value: `₦${stats.feesCollected.toLocaleString()}`, icon: '💰', color: 'green' },
    { label: 'Revenue MTD', value: `₦${stats.revenue.toLocaleString()}`, icon: '📈', color: 'blue' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your school operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 ${colorClasses[stat.color]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/school/people/students" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">👨‍🎓</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Students</span>
            </a>
            <a href="/school/people/teachers" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">👨‍🏫</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Teachers</span>
            </a>
            <a href="/school/finance" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">💰</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Collect Fees</span>
            </a>
            <a href="/school/timetable" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">📅</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">View Timetable</span>
            </a>
            <a href="/school/exams" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">📝</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Exam Settings</span>
            </a>
            <a href="/school/reports" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">View Reports</span>
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
