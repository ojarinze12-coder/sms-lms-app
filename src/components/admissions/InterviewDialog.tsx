'use client';

import { useState } from 'react';
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
}

interface InterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onSchedule: (applicationId: string, interviewData: InterviewScheduleData) => void;
}

interface InterviewScheduleData {
  date: string;
  time: string;
  location: string;
  instructions: string;
}

export function InterviewDialog({ open, onOpenChange, application, onSchedule }: InterviewDialogProps) {
  const [interviewSchedule, setInterviewSchedule] = useState<InterviewScheduleData>({
    date: '',
    time: '',
    location: '',
    instructions: '',
  });

  const handleSchedule = () => {
    if (application) {
      onSchedule(application.id, interviewSchedule);
      setInterviewSchedule({ date: '', time: '', location: '', instructions: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {application && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Applicant: <strong className="dark:text-white">{application.firstName} {application.lastName}</strong>
              <span className="text-gray-500 ml-2">({application.applicationNo})</span>
            </p>
          )}
          <div>
            <Label className="dark:text-gray-300">Interview Date *</Label>
            <Input 
              type="date" 
              value={interviewSchedule.date} 
              onChange={e => setInterviewSchedule({...interviewSchedule, date: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Time *</Label>
            <Input 
              type="time" 
              value={interviewSchedule.time} 
              onChange={e => setInterviewSchedule({...interviewSchedule, time: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Location *</Label>
            <Input 
              placeholder="e.g., Principal's Office" 
              value={interviewSchedule.location} 
              onChange={e => setInterviewSchedule({...interviewSchedule, location: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Instructions</Label>
            <Textarea 
              placeholder="Additional instructions for the interview..." 
              value={interviewSchedule.instructions} 
              onChange={e => setInterviewSchedule({...interviewSchedule, instructions: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSchedule} 
            className="w-full"
            disabled={!interviewSchedule.date || !interviewSchedule.time || !interviewSchedule.location}
          >
            Schedule Interview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
