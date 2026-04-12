'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-authFetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, AlertTriangle, FileText, Users, ArrowRight, Activity, Shield } from 'lucide-react';

interface Stats {
  medicalRecords: number;
  vaccinations: number;
  behaviorIncidents: number;
  transcripts: number;
  certificates: number;
}

export default function AcademicRecordsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    medicalRecords: 0,
    vaccinations: 0,
    behaviorIncidents: 0,
    transcripts: 0,
    certificates: 0,
  });

  useEffect(() => {
    authFetchStats();
  }, []);

  async function authFetchStats() {
    try {
      const [medRes, transRes, certRes] = await Promise.all([
        authFetch('/api/sms/students').then(r => r.json()),
        authFetch('/api/sms/transcripts').then(r => r.json()),
        authFetch('/api/lms/certificates/issuances').then(r => r.json()),
      ]);

      setStats({
        medicalRecords: Array.isArray(medRes) ? medRes.length : 0,
        vaccinations: 0,
        behaviorIncidents: 0,
        transcripts: Array.isArray(transRes.transcripts) ? transRes.transcripts.length : 0,
        certificates: Array.isArray(certRes.issuances) ? certRes.issuances.length : 0,
      });
    } catch (err) {
      console.error('Failed to authFetch stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const modules = [
    {
      id: 'medical',
      title: 'Medical Records',
      description: 'Track student health history, vaccinations, and chronic conditions',
      icon: Heart,
      color: 'bg-red-100 text-red-600',
      href: '/sms/academic-records/medical',
      features: [
        'Medical visit history',
        'Vaccination records',
        'Chronic conditions',
        'Allergy tracking',
        'Health reports',
      ],
    },
    {
      id: 'behavior',
      title: 'Behavioral Records',
      description: 'Monitor student behavior, incidents, and conduct tracking',
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-600',
      href: '/sms/academic-records/behavior',
      features: [
        'Behavior incidents',
        'Discipline tracking',
        'Daily behavior logs',
        'Point system',
        'Parent notifications',
      ],
    },
    {
      id: 'transcripts',
      title: 'Transcripts',
      description: 'Generate and manage official academic transcripts',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      href: '/sms/transcripts',
      features: [
        'Transcript generation',
        'PDF export',
        'Send to institutions',
        'Track delivery status',
        'Academic history',
      ],
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Create and issue digital certificates with QR verification',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      href: '/lms/certificates',
      features: [
        'Certificate templates',
        'Digital issuance',
        'QR code verification',
        'PDF certificates',
        'Send to recipients',
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Medical Records</p>
                <p className="text-2xl font-bold text-red-600">{stats.medicalRecords}</p>
              </div>
              <Heart className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Behavior Incidents</p>
                <p className="text-2xl font-bold text-orange-600">{stats.behaviorIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transcripts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.transcripts}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Certificates</p>
                <p className="text-2xl font-bold text-purple-600">{stats.certificates}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(module => (
          <Card key={module.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${module.color}`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                </div>
                <Link href={module.href}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-2">{module.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={module.href}>
                <Button className="w-full mt-4">
                  Open {module.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}