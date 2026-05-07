'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { 
  staffCategories, 
  employmentTypes, 
  nigerianStates, 
  banks,
  type StaffFormData,
  staffCategoryLabels,
  staffDepartmentLabels,
  staffPositionLabels,
  defaultStaffCategories,
  defaultStaffDepartments,
  defaultStaffPositions,
} from '@/types/staff';
import { Loader2, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface StaffFormProps {
  formData: StaffFormData;
  onChange: (data: StaffFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  submitting: boolean;
  branches?: { id: string; name: string; code: string }[];
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function StaffForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
  submitting,
  branches = [],
}: StaffFormProps) {
  const [generating, setGenerating] = useState(false);
  const [staffCategories, setStaffCategories] = useState<string[]>(defaultStaffCategories);
  const [staffDepartments, setStaffDepartments] = useState<string[]>(defaultStaffDepartments);
  const [staffPositions, setStaffPositions] = useState<string[]>(defaultStaffPositions);

  useEffect(() => {
    const fetchStaffConfig = async () => {
      try {
        const res = await authFetch('/api/sms/staff-config');
        if (res.ok) {
          const data = await res.json();
          if (data.staffCategories?.length > 0) setStaffCategories(data.staffCategories);
          if (data.staffDepartments?.length > 0) setStaffDepartments(data.staffDepartments);
          if (data.staffPositions?.length > 0) setStaffPositions(data.staffPositions);
        }
      } catch (err) {
        console.error('Failed to fetch staff config:', err);
      }
    };
    fetchStaffConfig();
  }, []);

  const handleChange = (field: keyof StaffFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  const handleGenerateId = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/sms/staff?action=generate-id');
      const data = await res.json();
      handleChange('employeeId', data.employeeId);
    } catch (err) {
      console.error('Failed to generate ID:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <div className="flex gap-2">
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                required
                className="flex-1"
                disabled={isEditing}
              />
              {!isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGenerateId}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={staffCategories.includes(formData.category) ? formData.category : ''} 
              onValueChange={(v) => {
                if (v === '__custom__') {
                  handleChange('category', '');
                } else {
                  handleChange('category', v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {staffCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {staffCategoryLabels[cat] || cat}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom (Enter below)</SelectItem>
              </SelectContent>
            </Select>
            {!staffCategories.includes(formData.category) && formData.category !== '' && (
              <Input 
                className="mt-2"
                placeholder="Enter custom category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            )}
          </div>
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branchId">Branch</Label>
              <Select value={formData.branchId || 'none'} onValueChange={(v) => handleChange('branchId', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={staffDepartments.includes(formData.department) ? formData.department : ''} 
              onValueChange={(v) => {
                if (v === '__custom__') {
                  handleChange('department', '');
                } else {
                  handleChange('department', v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {staffDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {staffDepartmentLabels[dept] || dept}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom (Enter below)</SelectItem>
              </SelectContent>
            </Select>
            {!staffDepartments.includes(formData.department) && formData.department !== '' && (
              <Input 
                className="mt-2"
                placeholder="Enter custom department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select 
              value={staffPositions.includes(formData.position) ? formData.position : ''} 
              onValueChange={(v) => {
                if (v === '__custom__') {
                  handleChange('position', '');
                } else {
                  handleChange('position', v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {staffPositions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {staffPositionLabels[pos] || pos}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom (Enter below)</SelectItem>
              </SelectContent>
            </Select>
            {!staffPositions.includes(formData.position) && formData.position !== '' && (
              <Input 
                className="mt-2"
                placeholder="Enter custom position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select value={formData.employmentType} onValueChange={(v) => handleChange('employmentType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>
        
        <div className="border-t pt-4 mt-2">
          <h4 className="font-medium text-sm text-gray-500 mb-3">Nigerian Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stateOfOrigin">State of Origin</Label>
              <Select value={formData.stateOfOrigin} onValueChange={(v) => handleChange('stateOfOrigin', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lgaOfOrigin">LGA of Origin</Label>
              <Input
                id="lgaOfOrigin"
                value={formData.lgaOfOrigin}
                onChange={(e) => handleChange('lgaOfOrigin', e.target.value)}
                placeholder="e.g. Ikeja"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => handleChange('qualification', e.target.value)}
                placeholder="e.g. BSc, NCE, OND"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <h4 className="font-medium text-sm text-gray-500 mb-3">Employment Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary (NGN)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleChange('salary', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <h4 className="font-medium text-sm text-gray-500 mb-3">Nigerian Compliance & Banking</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pensionPin">Pension PIN</Label>
              <Input
                id="pensionPin"
                value={formData.pensionPin}
                onChange={(e) => handleChange('pensionPin', e.target.value)}
                placeholder="e.g. PEN/123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nhfNumber">NHF Number</Label>
              <Input
                id="nhfNumber"
                value={formData.nhfNumber}
                onChange={(e) => handleChange('nhfNumber', e.target.value)}
                placeholder="e.g. NHF/123456"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="bvn">BVN</Label>
              <Input
                id="bvn"
                value={formData.bvn}
                onChange={(e) => handleChange('bvn', e.target.value)}
                placeholder="11-digit BVN"
                maxLength={11}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nin">NIN</Label>
              <Input
                id="nin"
                value={formData.nin}
                onChange={(e) => handleChange('nin', e.target.value)}
                placeholder="11-digit NIN"
                maxLength={11}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="payeTin">PAYE TIN</Label>
              <Input
                id="payeTin"
                value={formData.payeTin}
                onChange={(e) => handleChange('payeTin', e.target.value)}
                placeholder="e.g., 12345678-0001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Select value={formData.bankName} onValueChange={(v) => handleChange('bankName', v)}>
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
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => handleChange('bankAccount', e.target.value)}
                placeholder="10-digit account number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="bankSortCode">Bank Sort Code</Label>
              <Input
                id="bankSortCode"
                value={formData.bankSortCode}
                onChange={(e) => handleChange('bankSortCode', e.target.value)}
                placeholder="6-digit sort code"
                maxLength={6}
              />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {isEditing ? 'Update Staff' : 'Add Staff'}
        </Button>
      </DialogFooter>
    </form>
  );
}
