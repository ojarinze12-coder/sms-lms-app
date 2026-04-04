'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Heart, AlertTriangle, FileText, Users, Calendar } from 'lucide-react';

const menuItems = [
  { id: 'medical', label: 'Medical Records', icon: Heart, href: '/sms/academic-records/medical' },
  { id: 'behavior', label: 'Behavioral Records', icon: AlertTriangle, href: '/sms/academic-records/behavior' },
  { id: 'transcripts', label: 'Transcripts', icon: FileText, href: '/sms/transcripts' },
  { id: 'certificates', label: 'Certificates', icon: Users, href: '/lms/certificates' },
];

export default function AcademicRecordsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('medical');

  useEffect(() => {
    const path = pathname.split('/').pop() || 'medical';
    setActiveTab(path);
  }, [pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const item = menuItems.find(m => m.id === value);
    if (item) {
      router.push(item.href);
    }
  };

  const currentItem = menuItems.find(m => m.id === activeTab) || menuItems[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Records</h1>
          <p className="text-gray-500 mt-1">Manage student medical, behavioral, and academic records</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          {menuItems.map(item => (
            <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}