'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';

interface Application {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  entranceExamDate?: string;
  entranceExamTime?: string;
  entranceExamLocation?: string;
}

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onSchedule: (applicationId: string, examData: ExamScheduleData) => void;
}

interface ExamScheduleData {
  date: string;
  time: string;
  location: string;
  instructions: string;
}

export function ExamDialog({ open, onOpenChange, application, onSchedule }: ExamDialogProps) {
  const [currentApp, setCurrentApp] = useState<Application | null>(application ?? null);
  const [examSchedule, setExamSchedule] = useState<ExamScheduleData>({
    date: '',
    time: '',
    location: '',
    instructions: '',
  });

  useEffect(() => {
    if (open && application) {
      setCurrentApp(application);
      setExamSchedule({
        date: application.entranceExamDate ? new Date(application.entranceExamDate).toISOString().split('T')[0] : '',
        time: application.entranceExamTime || '',
        location: application.entranceExamLocation || '',
        instructions: '',
      });
    }
  }, [open, application]);

  const handleSchedule = () => {
    if (currentApp) {
      onSchedule(currentApp.id, examSchedule);
      setExamSchedule({ date: '', time: '', location: '', instructions: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Entrance Exam
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {currentApp && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Applicant: <strong className="dark:text-white">{currentApp.firstName} {currentApp.lastName}</strong>
              <span className="text-gray-500 ml-2">({currentApp.applicationNo})</span>
            </p>
          )}
          <div>
            <Label className="dark:text-gray-300">Exam Date *</Label>
            <Input 
              type="date" 
              value={examSchedule.date} 
              onChange={e => setExamSchedule({...examSchedule, date: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Time *</Label>
            <Input 
              type="time" 
              value={examSchedule.time} 
              onChange={e => setExamSchedule({...examSchedule, time: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Location *</Label>
            <Input 
              placeholder="e.g., School Hall A" 
              value={examSchedule.location} 
              onChange={e => setExamSchedule({...examSchedule, location: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Instructions</Label>
            <Textarea 
              placeholder="Additional instructions for the exam..." 
              value={examSchedule.instructions} 
              onChange={e => setExamSchedule({...examSchedule, instructions: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSchedule} 
            className="w-full"
            disabled={!examSchedule.date || !examSchedule.time || !examSchedule.location}
          >
            Schedule Exam
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
