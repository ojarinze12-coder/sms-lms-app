'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface LinkChildModalProps {
  onStudentIdChange: (value: string) => void;
  onRelationshipChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  studentId: string;
  relationship: string;
  linkError: string;
  linkSuccess: string;
  linking: boolean;
}

export default function LinkChildModal({
  studentId,
  relationship,
  linkError,
  linkSuccess,
  linking,
  onStudentIdChange,
  onRelationshipChange,
  onSubmit,
}: LinkChildModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Link a Child
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Link a Child</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Enter your child&apos;s student ID to request linking to your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId" className="dark:text-gray-300">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => onStudentIdChange(e.target.value)}
                placeholder="e.g., STU/2024/001"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relationship" className="dark:text-gray-300">Relationship</Label>
              <Select value={relationship} onValueChange={onRelationshipChange}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="GUARDIAN" className="dark:text-gray-200 dark:hover:bg-gray-700">Guardian</SelectItem>
                  <SelectItem value="FATHER" className="dark:text-gray-200 dark:hover:bg-gray-700">Father</SelectItem>
                  <SelectItem value="MOTHER" className="dark:text-gray-200 dark:hover:bg-gray-700">Mother</SelectItem>
                  <SelectItem value="SIBLING" className="dark:text-gray-200 dark:hover:bg-gray-700">Sibling</SelectItem>
                  <SelectItem value="RELATIVE" className="dark:text-gray-200 dark:hover:bg-gray-700">Relative</SelectItem>
                  <SelectItem value="OTHER" className="dark:text-gray-200 dark:hover:bg-gray-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkError && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 p-2 rounded dark:text-red-300">{linkError}</div>
            )}
            {linkSuccess && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/30 p-2 rounded dark:text-green-300">{linkSuccess}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={linking}>
              {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}