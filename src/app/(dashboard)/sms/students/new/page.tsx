'use client';

import { useState, useMemo, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { NIGERIAN_STATES, NIGERIAN_LGAS } from '@/lib/nigeria';
import { Loader2, Wand2 } from 'lucide-react';
import { PhotoCapture } from '@/components/photo-capture';
import { useBranch } from '@/lib/hooks/use-branch';

export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { selectedBranch, branches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    birthCertNo: '',
    jambRegNo: '',
    bloodGroup: '',
    genotype: '',
    branchId: '',
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
    // Auto-select current branch if in branch mode
    if (selectedBranch) {
      setFormData(prev => ({ ...prev, branchId: selectedBranch.id }));
    }
  }, [selectedBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authFetch('/api/sms/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branchId: formData.branchId || null,
          photo: photoPreview,
          dateOfBirth: formData.dateOfBirth || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', description: data.error || 'Failed to create student' });
        return;
      }

      toast({ description: 'Student created successfully' });
      router.push('/sms/students');
    } catch {
      toast({ variant: 'destructive', description: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <BackButton href="/sms/students" label="Back to Students" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mt-2">Add New Student</h1>
        <p className="text-gray-500">Enter student details including Nigerian-specific information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Capture */}
        <Card>
          <CardHeader>
            <CardTitle>Student Photo</CardTitle>
            <CardDescription>Capture a photo using webcam or upload from device</CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoCapture
              value={photoPreview || ''}
              onChange={setPhotoPreview}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Student identification and personal details</CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Student ID *</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., STU/2024/001"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={async () => {
                      setGenerating(true);
                      try {
                        const res = await authFetch('/api/sms/students?action=generate-id');
                        const data = await res.json();
                        setFormData({ ...formData, studentId: data.studentId });
                      } catch (err) {
                        toast({ variant: 'destructive', description: 'Failed to generate ID' });
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    disabled={generating}
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
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
              <div>
                <label className="block text-sm font-medium mb-2">School Branch *</label>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input 
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Middle Name</label>
                <Input 
                  placeholder="Middle name"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input 
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
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
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input 
                  placeholder="Residential address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
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
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input 
                  type="email"
                  placeholder="student@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input 
                  placeholder="+2348012345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigerian-Specific Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nigerian Information</CardTitle>
            <CardDescription>State of origin, LGA, and national registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">State of Origin</label>
                <Select value={formData.stateOfOrigin} onValueChange={(v) => setFormData({ ...formData, stateOfOrigin: v })}>
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
                <label className="block text-sm font-medium mb-2">Birth Certificate No.</label>
                <Input 
                  placeholder="BCN/2024/123456"
                  value={formData.birthCertNo}
                  onChange={(e) => setFormData({ ...formData, birthCertNo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">JAMB Registration No.</label>
                <Input 
                  placeholder="For SS3 students"
                  value={formData.jambRegNo}
                  onChange={(e) => setFormData({ ...formData, jambRegNo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>Blood group and genotype for health records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Blood Group</label>
                <Select value={formData.bloodGroup} onValueChange={(v) => setFormData({ ...formData, bloodGroup: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Genotype</label>
                <Select value={formData.genotype} onValueChange={(v) => setFormData({ ...formData, genotype: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genotype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AS">AS</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="SS">SS</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Student'}
          </Button>
          <Link href="/sms/students">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
