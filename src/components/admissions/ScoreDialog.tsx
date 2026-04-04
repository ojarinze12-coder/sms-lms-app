'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Check, X } from 'lucide-react';

interface Application {
  id: string;
  applicationNo: string;
  firstName: string;
  lastName: string;
  status: string;
  entranceExamScore?: number;
  interviewScore?: number;
  notes?: string;
}

interface ScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onSaveScores: (applicationId: string, scores: ScoreData) => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
}

interface ScoreData {
  entranceExamScore: string;
  interviewScore: string;
  notes: string;
}

export function ScoreDialog({ open, onOpenChange, application, onSaveScores, onApprove, onReject }: ScoreDialogProps) {
  const [currentApp, setCurrentApp] = useState<Application | null>(application ?? null);
  const [scores, setScores] = useState<ScoreData>({
    entranceExamScore: '',
    interviewScore: '',
    notes: '',
  });

  useEffect(() => {
    if (open && application) {
      setCurrentApp(application);
      setScores({
        entranceExamScore: application.entranceExamScore?.toString() ?? '',
        interviewScore: application.interviewScore?.toString() ?? '',
        notes: application.notes ?? '',
      });
    }
  }, [open, application]);

  const handleSave = () => {
    if (currentApp) {
      onSaveScores(currentApp.id, scores);
      setScores({ entranceExamScore: '', interviewScore: '', notes: '' });
    }
  };

  const handleApprove = () => {
    if (currentApp) {
      onApprove(currentApp.id);
      setScores({ entranceExamScore: '', interviewScore: '', notes: '' });
    }
  };

  const handleReject = () => {
    if (currentApp) {
      onReject(currentApp.id);
      setScores({ entranceExamScore: '', interviewScore: '', notes: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enter Assessment Scores
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {currentApp && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium dark:text-white">{currentApp.firstName} {currentApp.lastName}</p>
              <p className="text-sm text-gray-500">Application No: {currentApp.applicationNo}</p>
              <p className="text-sm text-gray-500">Status: {currentApp.status}</p>
            </div>
          )}
          
          <div>
            <Label className="dark:text-gray-300">Entrance Exam Score (%)</Label>
            <Input 
              type="number" 
              min="0" 
              max="100" 
              placeholder="0-100" 
              value={scores.entranceExamScore} 
              onChange={e => setScores({...scores, entranceExamScore: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <Label className="dark:text-gray-300">Interview Score (%)</Label>
            <Input 
              type="number" 
              min="0" 
              max="100" 
              placeholder="0-100" 
              value={scores.interviewScore} 
              onChange={e => setScores({...scores, interviewScore: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <Label className="dark:text-gray-300">Notes</Label>
            <Textarea 
              placeholder="Additional notes..." 
              value={scores.notes} 
              onChange={e => setScores({...scores, notes: e.target.value})} 
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              className="flex-1"
            >
              Save Scores
            </Button>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleApprove} 
              className="flex-1 bg-green-50 dark:bg-green-900/50 hover:bg-green-100 dark:hover:bg-green-900"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReject} 
              className="flex-1 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
