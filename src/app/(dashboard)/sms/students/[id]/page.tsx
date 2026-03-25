'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ArrowLeft,
  Edit,
  BookOpen,
  GraduationCap,
  CreditCard
} from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  genotype: string | null;
  stateOfOrigin: string | null;
  lgaOfOrigin: string | null;
  birthCertificateNo: string | null;
  jambRegistrationNo: string | null;
  status: string;
  photo: string | null;
  enrollments: Array<{
    id: string;
    academicClass: {
      name: string;
    };
    status: string;
  }>;
  attendances: Array<{
    id: string;
    date: string;
    status: string;
  }>;
  feePayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    feeStructure: {
      name: string;
    };
  }>;
}

export default function StudentDetailPage() {
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'classes' | 'attendance' | 'payments'>('details');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/sms/students/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
        }
      } catch (error) {
        console.error('Failed to fetch student:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Student not found</p>
        <Link href="/sms/students" className="text-blue-600 hover:underline">
          Back to Students
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      GRADUATED: 'outline',
      TRANSFERRED: 'outline',
      SUSPENDED: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/sms/students"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        <Link
          href={`/sms/students/${student.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
          Edit Student
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                </CardTitle>
                {getStatusBadge(student.status)}
              </div>
              <p className="text-gray-500">Student ID: {student.studentId}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 border-b mb-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'classes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Classes ({student.enrollments.length})
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'attendance'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Attendance ({student.attendances.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'payments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Payments ({student.feePayments.length})
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{student.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{student.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{student.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{student.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium">{student.bloodType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Genotype</p>
                    <p className="font-medium">{student.genotype || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State of Origin</p>
                    <p className="font-medium">{student.stateOfOrigin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LGA of Origin</p>
                    <p className="font-medium">{student.lgaOfOrigin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Birth Certificate No.</p>
                    <p className="font-medium">{student.birthCertificateNo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">JAMB Registration No.</p>
                    <p className="font-medium">{student.jambRegistrationNo || '-'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div>
                  {student.enrollments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No class enrollments</p>
                  ) : (
                    <div className="space-y-2">
                      {student.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                            <span>{enrollment.academicClass.name}</span>
                          </div>
                          <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div>
                  {student.attendances.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No attendance records</p>
                  ) : (
                    <div className="space-y-2">
                      {student.attendances.map((attendance) => (
                        <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{new Date(attendance.date).toLocaleDateString()}</span>
                          <Badge variant={attendance.status === 'PRESENT' ? 'default' : 'destructive'}>
                            {attendance.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  {student.feePayments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No payment records</p>
                  ) : (
                    <div className="space-y-2">
                      {student.feePayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{payment.feeStructure.name}</p>
                            <p className="text-sm text-gray-500">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₦{payment.amount.toLocaleString()}</p>
                            <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-medium">{student.studentId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{student.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{student.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{student.address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
