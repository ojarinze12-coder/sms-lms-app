'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, GraduationCap, BookOpen, FileText, TrendingUp, ArrowRight, Settings, CreditCard, Calendar, CheckCircle, Activity, BarChart3 } from 'lucide-react';

interface AdminAnalyticsData {
  overview: {
    schools: number;
    students: number;
    teachers: number;
    courses: number;
    exams: number;
    subscriptions: number;
  };
  performance: {
    passRate: number;
    averageScore: number;
    totalGradedExams: number;
  };
  subscriptions: {
    plans: {
      FREE: number;
      STARTER: number;
      PROFESSIONAL: number;
      ENTERPRISE: number;
    };
    statuses: {
      ACTIVE: number;
      PAST_DUE: number;
      CANCELLED: number;
      EXPIRED: number;
    };
  };
  recentSchools: Array<{
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    plan: string;
    createdAt: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadAnalytics();
    }
  }, [authLoading]);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed platform performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.overview.schools || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Registered on platform</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.overview.students || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Enrolled across schools</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.overview.teachers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active educators</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.overview.exams || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Platform-wide</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.subscriptions?.plans && Object.entries(data.subscriptions.plans).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      plan === 'ENTERPRISE' ? 'bg-purple-500' :
                      plan === 'PROFESSIONAL' ? 'bg-blue-500' :
                      plan === 'STARTER' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">{plan}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          plan === 'ENTERPRISE' ? 'bg-purple-500' :
                          plan === 'PROFESSIONAL' ? 'bg-blue-500' :
                          plan === 'STARTER' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(count as number / (data?.overview.schools || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-700">{data?.subscriptions?.statuses?.ACTIVE || 0}</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-red-700">{data?.subscriptions?.statuses?.CANCELLED || 0}</div>
                <div className="text-sm text-red-600">Cancelled</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-700">{data?.subscriptions?.statuses?.PAST_DUE || 0}</div>
                <div className="text-sm text-yellow-600">Past Due</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-700">{data?.subscriptions?.statuses?.EXPIRED || 0}</div>
                <div className="text-sm text-gray-600">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Academic Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600">{data?.performance?.passRate || 0}%</div>
              <div className="text-sm text-blue-600 mt-1">Pass Rate</div>
              <div className="text-xs text-gray-500 mt-2">Average across all schools</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-4xl font-bold text-green-600">{data?.performance?.averageScore || 0}</div>
              <div className="text-sm text-green-600 mt-1">Average Score</div>
              <div className="text-xs text-gray-500 mt-2">Mean score across exams</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-4xl font-bold text-purple-600">{data?.performance?.totalGradedExams || 0}</div>
              <div className="text-sm text-purple-600 mt-1">Graded Exams</div>
              <div className="text-xs text-gray-500 mt-2">Total graded this period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/tenants" className="block">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Manage Schools</div>
                  <div className="text-sm text-gray-500">View and manage all schools</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/subscriptions" className="block">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">Subscriptions</div>
                  <div className="text-sm text-gray-500">Manage billing and plans</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/settings" className="block">
          <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">Settings</div>
                  <div className="text-sm text-gray-500">Platform configuration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
