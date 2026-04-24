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
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface LinkChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  relationship: string;
  linkError: string;
  linkSuccess: string;
  linking: boolean;
  onStudentIdChange: (value: string) => void;
  onRelationshipChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  children?: React.ReactNode;
}

export default function LinkChildModal({
  open,
  onOpenChange,
  studentId,
  relationship,
  linkError,
  linkSuccess,
  linking,
  onStudentIdChange,
  onRelationshipChange,
  onSubmit,
}: LinkChildModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link a Child</DialogTitle>
          <DialogDescription>
            Enter your child&apos;s student ID to request linking to your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => onStudentIdChange(e.target.value)}
                placeholder="e.g., STU/2024/001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={onRelationshipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                  <SelectItem value="RELATIVE">Relative</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{linkError}</div>
            )}
            {linkSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{linkSuccess}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
