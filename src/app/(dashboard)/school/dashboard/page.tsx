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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/school/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
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
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your school operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border p-6 ${colorClasses[stat.color]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/school/people/students" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">👨‍🎓</span>
              <span className="text-sm font-medium">Manage Students</span>
            </a>
            <a href="/school/people/teachers" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">👨‍🏫</span>
              <span className="text-sm font-medium">Manage Teachers</span>
            </a>
            <a href="/school/finance" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">💰</span>
              <span className="text-sm font-medium">Collect Fees</span>
            </a>
            <a href="/school/timetable" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">📅</span>
              <span className="text-sm font-medium">View Timetable</span>
            </a>
            <a href="/school/exams" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">📝</span>
              <span className="text-sm font-medium">Exam Settings</span>
            </a>
            <a href="/school/reports" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium">View Reports</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
