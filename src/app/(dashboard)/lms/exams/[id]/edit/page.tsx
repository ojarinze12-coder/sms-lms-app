'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { examApi } from '@/lib/api';
import type { Question } from '@/types/exam';

export default function ExamEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const examId = params.id as string;

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const data = await examApi.get(examId);
      if (data.status !== 'DRAFT') {
        toast({ variant: 'destructive', title: 'Error', description: 'Can only edit draft exams' });
        router.push(`/lms/exams/${examId}`);
        return;
      }
      setExam(data);
      setQuestions((data.questions || []).map((q: Question) => ({ ...q, tempId: q.id })));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to load exam' });
      router.push('/lms/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => {
    const newQuestion: any = {
      tempId: `temp-${Date.now()}`,
      content: '',
      type,
      points: 1,
      order: questions.length + 1,
      options: type === 'TRUE_FALSE' 
        ? [{ content: 'True', isCorrect: false, order: 1 }, { content: 'False', isCorrect: false, order: 2 }]
        : type === 'MULTIPLE_CHOICE'
        ? [{ content: '', isCorrect: false, order: 1 }, { content: '', isCorrect: false, order: 2 }, { content: '', isCorrect: false, order: 3 }, { content: '', isCorrect: false, order: 4 }]
        : [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (tempId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  const handleDeleteQuestion = async (tempId: string) => {
    const question = questions.find(q => q.tempId === tempId);
    if (!question?.id || question.id.startsWith('temp-')) {
      setQuestions(questions.filter(q => q.tempId !== tempId));
      return;
    }
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await examApi.deleteQuestion(examId, question.id);
      setQuestions(questions.filter(q => q.tempId !== tempId));
      toast({ title: 'Success', description: 'Question deleted' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateOption = (questionTempId: string, optionIndex: number, updates: any) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId) {
        const newOptions = [...(q.options || [])];
        newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSetCorrectOption = (questionTempId: string, optionIndex: number) => {
    setQuestions(questions.map((q: any) => {
      if (q.tempId === questionTempId) {
        const newOptions = q.options?.map((opt: any, idx: number) => ({ ...opt, isCorrect: idx === optionIndex }));
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAddOption = (questionTempId: string) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId && q.options) {
        return { ...q, options: [...q.options, { content: '', isCorrect: false, order: q.options.length + 1 }] };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionTempId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId && q.options && q.options.length > 2) {
        const newOptions = q.options.filter((_: any, idx: number) => idx !== optionIndex).map((opt: any, idx: number) => ({ ...opt, order: idx + 1 }));
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existingQuestions = await examApi.getQuestions(examId);
      const existingIds = new Set(existingQuestions.map((q: Question) => q.id));

      for (const q of questions) {
        if (q.tempId.startsWith('temp-')) {
          await examApi.addQuestion(examId, { content: q.content, type: q.type, points: q.points, order: q.order, options: q.options });
        }
      }

      toast({ title: 'Success', description: 'Questions saved successfully' });
      router.push(`/lms/exams/${examId}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!exam) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Questions</h1>
            <p className="text-muted-foreground">{exam.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/lms/exams/${examId}`)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Add or edit questions for this exam</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}><Plus className="mr-2 h-4 w-4" />MCQ</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('TRUE_FALSE')}><Plus className="mr-2 h-4 w-4" />T/F</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('SHORT_ANSWER')}><Plus className="mr-2 h-4 w-4" />Short Answer</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No questions yet</p><p className="text-sm">Click a button above to add questions</p></div>
          ) : (
            questions.map((question, qIndex) => (
              <Card key={question.tempId} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{qIndex + 1}</Badge>
                      <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
                      <div className="flex items-center gap-2 ml-auto">
                        <Label className="text-sm">Points:</Label>
                        <Input type="number" className="w-16 h-8" value={question.points} onChange={(e) => handleUpdateQuestion(question.tempId, { points: parseInt(e.target.value) || 1 })} />
                      </div>
                    </div>
                    <Textarea placeholder="Enter question content..." value={question.content} onChange={(e) => handleUpdateQuestion(question.tempId, { content: e.target.value })} />
                    {question.type !== 'SHORT_ANSWER' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Options (click to mark correct)</Label>
                        {question.options?.map((option: any, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Button variant={option.isCorrect ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => handleSetCorrectOption(question.tempId, oIndex)}>{String.fromCharCode(65 + oIndex)}</Button>
                            <Input placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} value={option.content} onChange={(e) => handleUpdateOption(question.tempId, oIndex, { content: e.target.value })} className="flex-1" />
                            {question.options && question.options.length > 2 && <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(question.tempId, oIndex)}><Trash2 className="h-4 w-4" /></Button>}
                          </div>
                        ))}
                        {question.type === 'MULTIPLE_CHOICE' && <Button variant="ghost" size="sm" onClick={() => handleAddOption(question.tempId)}><Plus className="mr-2 h-4 w-4" />Add Option</Button>}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
