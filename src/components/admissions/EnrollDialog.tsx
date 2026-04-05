'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

interface Application {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  applyingClassId: string;
  applyingClass?: { name: string };
  email?: string;
  phone?: string;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
}

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onEnroll: (applicationId: string, classId: string) => void;
}

export function EnrollDialog({ open, onOpenChange, application, onEnroll }: EnrollDialogProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (open && application?.applyingClassId) {
      setSelectedClassId(application.applyingClassId);
      fetchClasses();
    }
  }, [open, application]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch('/api/sms/academic-classes');
      const response = await res.json();
      const data = response.data || response || [];
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleEnroll = () => {
    if (application && selectedClassId) {
      onEnroll(application.id, selectedClassId);
      setSelectedClassId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Enroll Student
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {application && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium dark:text-white">{application.firstName} {application.lastName}</p>
              <p className="text-sm text-gray-500">Application No: {application.applicationNo}</p>
              {application.email && <p className="text-sm text-gray-500">{application.email}</p>}
              {application.phone && <p className="text-sm text-gray-500">{application.phone}</p>}
            </div>
          )}
          
          <div>
            <Label className="dark:text-gray-300">Enrollment Class *</Label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading classes...</span>
              </div>
            ) : (
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => {
                    const fullClassName = cls.department 
                      ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                      : cls.stream 
                        ? `${cls.name}-${cls.stream}`
                        : cls.name;
                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {fullClassName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This will create a student record and mark the application as enrolled.
              The student will be able to access the LMS system.
            </p>
          </div>

          <Button 
            onClick={handleEnroll} 
            className="w-full"
            disabled={!selectedClassId || loadingClasses}
          >
            Enroll Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
