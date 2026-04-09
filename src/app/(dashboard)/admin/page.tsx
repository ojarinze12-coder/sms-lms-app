'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, GraduationCap, BookOpen, FileText, TrendingUp, CreditCard, ArrowRight, Settings } from 'lucide-react';

interface Stats {
  schools: number;
  students: number;
  teachers: number;
  courses: number;
  exams: number;
  subscriptions: number;
}

interface SubscriptionStatus {
  plans: Record<string, number>;
  statuses: Record<string, number>;
}

interface RecentSchool {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  createdAt: string;
}

interface RevenueData {
  overview: {
    totalTenants: number;
    activeSubscriptions: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
    newTenantsThisPeriod: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionStatus | null>(null);
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([]);
  const [revenue, setRevenue] = useState<RevenueData['overview'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics').then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error || 'Analytics failed');
        }
        return r.json();
      }),
      fetch('/api/admin/analytics/revenue').then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error || 'Revenue failed');
        }
        return r.json();
      }),
    ])
      .then(([analyticsData, revenueData]) => {
        if (analyticsData.error) {
          setError(analyticsData.error);
          return;
        }
        setStats(analyticsData.overview);
        setSubscriptions(analyticsData.subscriptions);
        setRecentSchools(analyticsData.recentSchools || []);
        setRevenue(revenueData.overview);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please ensure you are logged in as Super Admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getGreeting()}, Super Admin!</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-2 text-lg">Welcome to Platform Control Center</p>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Logo size="xl" showText={true} className="text-white opacity-90" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/tenants">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-blue-500 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Schools</CardTitle>
              <Building2 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.schools || 0}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> Active schools
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/tenants">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-green-500 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</CardTitle>
              <GraduationCap className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.students || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Across all schools
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/tenants">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-purple-500 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teachers</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.teachers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Across all schools
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/subscriptions">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-orange-500 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</CardTitle>
              <FileText className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(revenue?.totalRevenue || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Platform revenue
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions & Subscription Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Settings className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/tenants" className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <span className="font-medium">Manage Schools</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/subscriptions" className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Subscriptions & Billing</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/analytics" className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">View Detailed Analytics</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Subscription Summary */}
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptions?.plans?.FREE || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Free Plan</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{subscriptions?.plans?.STARTER || 0}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Starter Plan</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{subscriptions?.plans?.PROFESSIONAL || 0}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Professional Plan</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{subscriptions?.plans?.ENTERPRISE || 0}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Enterprise Plan</div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Active Subscriptions</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{subscriptions?.statuses?.ACTIVE || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Schools */}
      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Building2 className="h-5 w-5 text-blue-600" />
            Recent Schools
          </CardTitle>
          <Link href="/admin/tenants" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {!recentSchools || recentSchools.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No schools yet</p>
          ) : (
            <div className="space-y-3">
              {recentSchools.slice(0, 5).map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{school.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{school.domain || school.slug}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      school.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      school.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      school.plan === 'STARTER' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {school.plan}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(school.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
