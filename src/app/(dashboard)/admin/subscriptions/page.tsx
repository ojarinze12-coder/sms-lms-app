'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface SubscriptionData {
  overview: {
    schools: number;
    subscriptions: number;
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
}

export default function AdminSubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
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

  const totalSchools = data?.overview.schools || 0;
  const activeSubscriptions = data?.subscriptions.statuses.ACTIVE || 0;
  const freeSchools = data?.subscriptions.plans.FREE || 0;
  const paidSchools = totalSchools - freeSchools;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Subscriptions & Billing</h1>
        <p className="text-gray-600">Overview of all school subscriptions on the platform</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSchools}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paid Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{paidSchools}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Free Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{freeSchools}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="font-medium">Free Plan</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data?.subscriptions.plans.FREE || 0}</div>
                  <div className="text-xs text-gray-500">{totalSchools > 0 ? Math.round((data?.subscriptions.plans.FREE || 0) / totalSchools * 100) : 0}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Starter Plan</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data?.subscriptions.plans.STARTER || 0}</div>
                  <div className="text-xs text-gray-500">{totalSchools > 0 ? Math.round((data?.subscriptions.plans.STARTER || 0) / totalSchools * 100) : 0}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Professional Plan</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data?.subscriptions.plans.PROFESSIONAL || 0}</div>
                  <div className="text-xs text-gray-500">{totalSchools > 0 ? Math.round((data?.subscriptions.plans.PROFESSIONAL || 0) / totalSchools * 100) : 0}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="font-medium">Enterprise Plan</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{data?.subscriptions.plans.ENTERPRISE || 0}</div>
                  <div className="text-xs text-gray-500">{totalSchools > 0 ? Math.round((data?.subscriptions.plans.ENTERPRISE || 0) / totalSchools * 100) : 0}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Active</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {data?.subscriptions.statuses.ACTIVE || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Cancelled</span>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {data?.subscriptions.statuses.CANCELLED || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Past Due</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {data?.subscriptions.statuses.PAST_DUE || 0}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Expired</span>
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {data?.subscriptions.statuses.EXPIRED || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
