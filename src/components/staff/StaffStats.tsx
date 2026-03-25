'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { staffCategories, type Staff } from '@/types/staff';

interface StaffStatsProps {
  staff: Staff[];
}

export default function StaffStats({ staff }: StaffStatsProps) {
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'ACTIVE').length,
    onLeave: staff.filter(s => s.status === 'ON_LEAVE').length,
    byCategory: staffCategories.map(cat => ({
      category: cat.label,
      count: staff.filter(s => s.category === cat.value).length,
    })).filter(c => c.count > 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">On Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byCategory.length}</div>
        </CardContent>
      </Card>
    </div>
  );
}
