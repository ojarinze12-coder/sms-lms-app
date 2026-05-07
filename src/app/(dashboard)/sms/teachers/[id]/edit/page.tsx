'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useBranch } from '@/lib/hooks/use-branch';
import { NIGERIAN_STATES, NIGERIAN_LGAS } from '@/lib/nigeria';
import { banks, teacherPositionLabels, defaultTeacherPositions } from '@/types/staff';

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  qualification?: string | null;
  experience?: number | null;
  basicSalary?: number | null;
  joinDate?: string | null;
  address?: string | null;
  stateOfOrigin?: string | null;
  lgaOfOrigin?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  status?: string;
  branchId?: string | null;
  position?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  pensionPin?: string | null;
  nhfNumber?: string | null;
  bvn?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankSortCode?: string | null;
  departmentRelation?: { id: string; name: string; code: string } | null;
}

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;
  const { branches } = useBranch();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherPositions, setTeacherPositions] = useState<string[]>(defaultTeacherPositions);
  const [departments, setDepartments] = useState<{id: string, name: string, code: string}[]>([]);

  useEffect(() => {
    const fetchStaffConfig = async () => {
      try {
        const res = await authFetch('/api/sms/staff-config');
        if (res.ok) {
          const data = await res.json();
          if (data.teacherPositions?.length > 0) {
            setTeacherPositions(data.teacherPositions);
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff config:', err);
      }
    };
    fetchStaffConfig();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await authFetch('/api/sms/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    qualification: '',
    experience: '',
    salary: '',
    joinDate: '',
    address: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    dateOfBirth: '',
    gender: 'MALE',
    status: 'ACTIVE',
    branchId: '',
    position: '',
    departmentId: '',
    employmentType: 'FULL_TIME',
    pensionPin: '',
    nhfNumber: '',
    bvn: '',
    nin: '',
    payeTin: '',
    bankName: '',
    bankAccount: '',
    bankSortCode: '',
  });

  const stateCode = useMemo(() => {
    const state = NIGERIAN_STATES.find(s => s.name === formData.stateOfOrigin);
    return state?.code || '';
  }, [formData.stateOfOrigin]);

  const lgas = useMemo(() => {
    if (!stateCode) return [];
    return NIGERIAN_LGAS[stateCode] || [];
  }, [stateCode]);

  useEffect(() => {
    fetchTeacher();
  }, [teacherId]);

  const fetchTeacher = async () => {
    try {
      const res = await authFetch(`/api/sms/teachers/${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        const teacher: Teacher = data.teacher || data;
        setFormData({
          employeeId: teacher.employeeId || '',
          firstName: teacher.firstName || '',
          lastName: teacher.lastName || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          specialty: teacher.specialty || '',
          qualification: teacher.qualification || '',
          experience: teacher.experience?.toString() || '',
          salary: teacher.basicSalary?.toString() || '',
          joinDate: teacher.joinDate ? teacher.joinDate.split('T')[0] : '',
          address: teacher.address || '',
          stateOfOrigin: teacher.stateOfOrigin || '',
          lgaOfOrigin: teacher.lgaOfOrigin || '',
          dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '',
          gender: teacher.gender || 'MALE',
          status: teacher.status || 'ACTIVE',
          branchId: teacher.branchId || '',
          position: teacher.position || '',
          departmentId: teacher.departmentId || '',
          employmentType: teacher.employmentType || 'FULL_TIME',
          pensionPin: teacher.pensionPin || '',
          nhfNumber: teacher.nhfNumber || '',
          bvn: teacher.bvn || '',
          nin: (teacher as any).nin || '',
          payeTin: (teacher as any).payeTin || '',
          bankName: teacher.bankName || '',
          bankAccount: teacher.bankAccount || '',
          bankSortCode: teacher.bankSortCode || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await authFetch(`/api/sms/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branchId: formData.branchId || null,
          experience: formData.experience ? parseInt(formData.experience) : null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          joinDate: formData.joinDate || null,
          dateOfBirth: formData.dateOfBirth || null,
        }),
      });

      if (res.ok) {
        router.push(`/sms/teachers/${teacherId}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update teacher');
      }
    } catch (err) {
      console.error('Failed to update teacher:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/sms/teachers/${teacherId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Teacher
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Teacher</h1>
        <p className="text-gray-500">Update teacher details including Nigerian-specific information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Teacher identification and personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee ID *</label>
                <Input 
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">School Branch</label>
                <Select 
                  value={formData.branchId} 
                  onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input 
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input 
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Email and phone for communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Qualifications and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Specialty/Subject</label>
                <Input 
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Qualification</label>
                <Select value={formData.qualification} onValueChange={(v) => setFormData({ ...formData, qualification: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NCE">NCE</SelectItem>
                    <SelectItem value="OND">OND</SelectItem>
                    <SelectItem value="HND">HND</SelectItem>
                    <SelectItem value="BSc">BSc</SelectItem>
                    <SelectItem value="BEd">BEd</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="PGDE">PGDE</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MSc">MSc</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employment Type</label>
                <Select value={formData.employmentType} onValueChange={(v) => setFormData({ ...formData, employmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <Select 
                  value={teacherPositions.includes(formData.position) ? formData.position : ''} 
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setFormData({ ...formData, position: '' });
                    } else {
                      setFormData({ ...formData, position: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherPositions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {teacherPositionLabels[pos] || pos}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom (Enter below)</SelectItem>
                  </SelectContent>
                </Select>
                {!teacherPositions.includes(formData.position) && formData.position !== '' && (
                  <Input 
                    className="mt-2"
                    placeholder="Enter custom position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary (Monthly)</label>
                <Input 
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <Input 
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Join Date</label>
                <Input 
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigerian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nigerian Information</CardTitle>
            <CardDescription>State of origin, LGA, and date of birth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">State of Origin</label>
                <Select value={formData.stateOfOrigin} onValueChange={(v) => setFormData({ ...formData, stateOfOrigin: v, lgaOfOrigin: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">LGA of Origin</label>
                <Select 
                  value={formData.lgaOfOrigin} 
                  onValueChange={(v) => setFormData({ ...formData, lgaOfOrigin: v })}
                  disabled={!formData.stateOfOrigin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.stateOfOrigin ? "Select LGA" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((lga) => (
                      <SelectItem key={lga} value={lga}>
                        {lga}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <Input 
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigerian Compliance & Banking */}
        <Card>
          <CardHeader>
            <CardTitle>Nigerian Compliance & Banking</CardTitle>
            <CardDescription>Pension, NHF, BVN, and bank details for payroll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pension PIN</label>
                <Input 
                  value={formData.pensionPin}
                  onChange={(e) => setFormData({ ...formData, pensionPin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">NHF Number</label>
                <Input 
                  value={formData.nhfNumber}
                  onChange={(e) => setFormData({ ...formData, nhfNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">BVN</label>
                <Input 
                  value={formData.bvn}
                  onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
                  maxLength={11}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">NIN</label>
                <Input 
                  value={formData.nin}
                  onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                  maxLength={11}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">PAYE TIN</label>
                <Input 
                  value={formData.payeTin}
                  onChange={(e) => setFormData({ ...formData, payeTin: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <Select value={formData.bankName} onValueChange={(v) => setFormData({ ...formData, bankName: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <Input 
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bank Sort Code</label>
                <Input 
                  value={formData.bankSortCode}
                  onChange={(e) => setFormData({ ...formData, bankSortCode: e.target.value })}
                  maxLength={6}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Link href={`/sms/teachers/${teacherId}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}