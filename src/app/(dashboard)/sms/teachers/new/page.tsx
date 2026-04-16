'use client';

import { useState, useMemo } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useBranch } from '@/lib/hooks/use-branch';

export default function NewTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { selectedBranch, branches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
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
    gender: 'MALE',
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

  // Auto-select current branch
  useMemo(() => {
    if (selectedBranch && !formData.branchId) {
      setFormData(prev => ({ ...prev, branchId: selectedBranch.id }));
    }
  }, [selectedBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authFetch('/api/sms/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branchId: formData.branchId || null,
          experience: formData.experience ? parseInt(formData.experience) : null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          joinDate: formData.joinDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', description: data.error || 'Failed to create teacher' });
        return;
      }

      toast({ description: 'Teacher created successfully' });
      router.push('/sms/teachers');
    } catch {
      toast({ variant: 'destructive', description: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/sms/teachers"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Teachers
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add New Teacher</h1>
        <p className="text-gray-500">Enter teacher details including Nigerian-specific information</p>
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
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., TCH/2024/001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={async () => {
                      setGenerating(true);
                      try {
                        const res = await authFetch('/api/sms/teachers?action=generate-id');
                        const data = await res.json();
                        setFormData({ ...formData, employeeId: data.employeeId });
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

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input 
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input 
                placeholder="Residential address"
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
                  placeholder="teacher@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
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
                  placeholder="e.g., Mathematics, Physics"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
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
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <Input 
                  type="number"
                  placeholder="e.g., 5"
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
              <div>
                <label className="block text-sm font-medium mb-2">Salary (Monthly)</label>
                <Input 
                  type="number"
                  placeholder="e.g., 150000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nigerian-Specific Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nigerian Information</CardTitle>
            <CardDescription>State of origin and LGA</CardDescription>
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
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Teacher'}
          </Button>
          <Link href="/sms/teachers">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
