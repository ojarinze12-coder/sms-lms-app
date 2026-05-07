'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
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
  Briefcase
} from 'lucide-react';

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  qualification: string | null;
  experience: number | null;
  basicSalary: number | null;
  joinDate: string | null;
  status: string;
  address: string | null;
  stateOfOrigin: string | null;
  lgaOfOrigin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  branchId: string | null;
  position: string | null;
  departmentId: string | null;
  employmentType: string | null;
  pensionPin: string | null;
  nhfNumber: string | null;
  bvn: string | null;
  nin: string | null;
  payeTin: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankSortCode: string | null;
  branch?: { id: string; name: string; code: string } | null;
  departmentRelation?: { id: string; name: string; code: string } | null;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  staffLeaves: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

export default function TeacherDetailPage() {
  const params = useParams();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'nigerian' | 'employment' | 'banking' | 'subjects' | 'leaves'>('details');

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await authFetch(`/api/sms/teachers/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTeacher(data.teacher);
        }
      } catch (error) {
        console.error('Failed to fetch teacher:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTeacher();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Teacher not found</p>
        <Link href="/sms/teachers" className="text-blue-600 hover:underline">
          Back to Teachers
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      ON_LEAVE: 'outline',
      TERMINATED: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/sms/teachers"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teachers
        </Link>
        <Link
          href={`/sms/teachers/${teacher.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
          Edit Teacher
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {teacher.firstName} {teacher.lastName}
                </CardTitle>
                {getStatusBadge(teacher.status)}
              </div>
              <p className="text-gray-500">Employee ID: {teacher.employeeId}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 border-b mb-4 flex-wrap">
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
                  onClick={() => setActiveTab('nigerian')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'nigerian'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Nigerian Info
                </button>
                <button
                  onClick={() => setActiveTab('employment')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'employment'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Employment
                </button>
                <button
                  onClick={() => setActiveTab('banking')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'banking'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Banking
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'subjects'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Subjects ({teacher.subjects.length})
                </button>
                <button
                  onClick={() => setActiveTab('leaves')}
                  className={`px-4 py-2 -mb-px border-b-2 ${
                    activeTab === 'leaves'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  Leave Records ({teacher.staffLeaves.length})
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{teacher.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{teacher.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Specialty</p>
                    <p className="font-medium">{teacher.specialty || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Qualification</p>
                    <p className="font-medium">{teacher.qualification || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Years of Experience</p>
                    <p className="font-medium">{teacher.experience || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="font-medium">
                      {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{teacher.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-medium">
                      {teacher.basicSalary ? `₦${teacher.basicSalary.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Branch</p>
                    <p className="font-medium">{teacher.branch?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{teacher.gender || '-'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'nigerian' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">State of Origin</p>
                    <p className="font-medium">{teacher.stateOfOrigin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LGA of Origin</p>
                    <p className="font-medium">{teacher.lgaOfOrigin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">
                      {teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p className="font-medium">{teacher.employmentType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{teacher.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{teacher.departmentRelation?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Salary</p>
                    <p className="font-medium">
                      {teacher.basicSalary ? `₦${teacher.basicSalary.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="font-medium">
                      {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Years of Experience</p>
                    <p className="font-medium">{teacher.experience || '-'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'banking' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Pension PIN</p>
                    <p className="font-medium">{teacher.pensionPin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NHF Number</p>
                    <p className="font-medium">{teacher.nhfNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">BVN</p>
                    <p className="font-medium">{teacher.bvn || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NIN</p>
                    <p className="font-medium">{teacher.nin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAYE TIN</p>
                    <p className="font-medium">{teacher.payeTin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-medium">{teacher.bankName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium">{teacher.bankAccount || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bank Sort Code</p>
                    <p className="font-medium">{teacher.bankSortCode || '-'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div>
                  {teacher.subjects.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No subjects assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {teacher.subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                            <span>{subject.name}</span>
                          </div>
                          <Badge variant="outline">{subject.code}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'leaves' && (
                <div>
                  {teacher.staffLeaves.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No leave records</p>
                  ) : (
                    <div className="space-y-2">
                      {teacher.staffLeaves.map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{leave.leaveType}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={leave.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {leave.status}
                          </Badge>
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
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium">{teacher.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{teacher.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="font-medium">{teacher.specialty || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium">
                    {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
