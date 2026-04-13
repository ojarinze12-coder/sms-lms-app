'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Activity,
  Settings
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  brandColor: string;
  logo: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    students: number;
    teachers: number;
    users: number;
    courses: number;
  };
  subscriptions: Array<{
    id: string;
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    subscriptionPlan: {
      name: string;
      displayName: string;
      monthlyPrice: number;
      yearlyPrice: number;
    } | null;
  }>;
  tenantConfig: {
    primaryColor: string | null;
    curriculumType: string | null;
  } | null;
  tenantHealth: {
    overallScore: number;
    healthGrade: string;
  } | null;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  const fetchTenant = async () => {
    try {
      const res = await authFetch(`/api/admin/tenants/${params.id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load tenant');
        return;
      }
      const data = await res.json();
      setTenant(data.tenant);
      setActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Failed to fetch tenant:', err);
      setError('Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'D': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'F': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Tenant not found'}</p>
        <Link href="/admin/tenants">
          <Button variant="outline">Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  const activeSubscription = tenant.subscriptions?.[0];
  const currentPlan = activeSubscription?.subscriptionPlan;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tenants">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/tenants/${tenant.id}/data`}>
            <Button variant="outline">
              Manage Data
            </Button>
          </Link>
          <Badge className={getStatusColor(tenant.status)}>
            {tenant.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">School Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: tenant.brandColor }}
              >
                {tenant.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{tenant.slug}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {tenant.domain && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  {tenant.domain}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                Joined {new Date(tenant.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{currentPlan.displayName}</span>
                  <Badge>{currentPlan.name}</Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{currentPlan.monthlyPrice.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Billing: {activeSubscription.billingCycle}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Period: {new Date(activeSubscription.currentPeriodStart).toLocaleDateString()} - {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No active subscription</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.tenantHealth ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{tenant.tenantHealth.overallScore}</span>
                  <Badge className={getHealthColor(tenant.tenantHealth.healthGrade)}>
                    Grade {tenant.tenantHealth.healthGrade}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall platform health score
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No health data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant._count.users}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant._count.students}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant._count.teachers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant._count.courses}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activity.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
