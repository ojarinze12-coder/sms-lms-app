'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExamFormData } from '@/types/exam-wizard';
import { examTypes } from '@/types/exam-wizard';

interface ExamDetailsStepProps {
  exam: ExamFormData;
  onChange: (exam: ExamFormData) => void;
  terms: any[];
  subjects: any[];
}

export default function ExamDetailsStep({ exam, onChange, terms, subjects }: ExamDetailsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>Enter the basic information about the exam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Exam Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Chapter 5 Mathematics Quiz"
            value={exam.title}
            onChange={(e) => onChange({ ...exam, title: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional description for the exam"
            value={exam.description}
            onChange={(e) => onChange({ ...exam, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Exam Type *</Label>
            <Select
              value={exam.examType}
              onValueChange={(value: any) => onChange({ ...exam, examType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={180}
              value={exam.duration}
              onChange={(e) => onChange({ ...exam, duration: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Term *</Label>
            <Select
              value={exam.termId}
              onValueChange={(value) => onChange({ ...exam, termId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Subject *</Label>
            <Select
              value={exam.subjectId}
              onValueChange={(value) => onChange({ ...exam, subjectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time (optional)</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={exam.startTime}
              onChange={(e) => onChange({ ...exam, startTime: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time (optional)</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={exam.endTime}
              onChange={(e) => onChange({ ...exam, endTime: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
