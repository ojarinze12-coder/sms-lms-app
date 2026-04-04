'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { examApi, academicApi } from '@/lib/api';
import type { ExamFormData, Question } from '@/types/exam-wizard';
import { getInitialExamForm, createNewQuestion } from '@/types/exam-wizard';
import ExamDetailsStep from '@/components/exam-wizard/ExamDetailsStep';
import ExamQuestionsStep from '@/components/exam-wizard/ExamQuestionsStep';
import ExamReviewStep from '@/components/exam-wizard/ExamReviewStep';

export default function NewExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exam, setExam] = useState<ExamFormData>(getInitialExamForm());
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadAcademicData();
  }, []);

  const loadAcademicData = async () => {
    try {
      const [termsData, subjectsData] = await Promise.all([
        academicApi.getTerms(),
        academicApi.getSubjects(),
      ]) as [any, any];
      setTerms(Array.isArray(termsData) ? termsData : (termsData?.data || []));
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []));
    } catch (error) {
      console.error('Error loading academic data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => {
    const newQuestion = createNewQuestion(type, questions.length + 1);
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (tempId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  const handleDeleteQuestion = (tempId: string) => {
    setQuestions(questions.filter(q => q.tempId !== tempId));
  };

  const handleUpdateOption = (questionTempId: string, optionIndex: number, updates: Partial<any>) => {
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
    setQuestions(questions.map((q) => {
      if (q.tempId === questionTempId) {
        const newOptions = q.options?.map((opt, idx) => ({
          ...opt,
          isCorrect: idx === optionIndex,
        }));
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAddOption = (questionTempId: string) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId && q.options) {
        return {
          ...q,
          options: [
            ...q.options,
            { content: '', isCorrect: false, order: q.options.length + 1 },
          ],
        };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionTempId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.tempId === questionTempId && q.options && q.options.length > 2) {
        const newOptions = q.options
          .filter((_, idx) => idx !== optionIndex)
          .map((opt, idx) => ({ ...opt, order: idx + 1 }));
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const validateStep1 = () => {
    if (!exam.title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title is required' });
      return false;
    }
    if (!exam.termId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a term' });
      return false;
    }
    if (!exam.subjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a subject' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one question' });
      return false;
    }
    for (const q of questions) {
      if (!q.content.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'All questions must have content' });
        return false;
      }
      if (q.type !== 'SHORT_ANSWER') {
        const hasCorrect = q.options?.some((o) => o.isCorrect);
        if (!hasCorrect) {
          toast({ variant: 'destructive', title: 'Error', description: 'Each question must have a correct answer' });
          return false;
        }
        const hasEmptyOption = q.options?.some((o) => !o.content.trim());
        if (hasEmptyOption) {
          toast({ variant: 'destructive', title: 'Error', description: 'All options must have content' });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    try {
      const createdExam = await examApi.create(exam);
      
      for (const q of questions) {
        await examApi.addQuestion(createdExam.id, {
          content: q.content,
          type: q.type,
          points: q.points,
          order: q.order,
          options: q.options as any[],
        });
      }

      toast({
        title: 'Success',
        description: 'Exam created successfully',
      });
      
      router.push('/lms/exams');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create exam',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
          <p className="text-muted-foreground">Create a new exam for your students</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">Details</span>
        </div>
        <div className="w-12 h-0.5 bg-muted self-center" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step > 2 ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className="text-sm font-medium">Questions</span>
        </div>
        <div className="w-12 h-0.5 bg-muted self-center" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium">Review</span>
        </div>
      </div>

      {step === 1 && (
        <ExamDetailsStep
          exam={exam}
          onChange={setExam}
          terms={terms}
          subjects={subjects}
        />
      )}

      {step === 2 && (
        <ExamQuestionsStep
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onUpdateOption={handleUpdateOption}
          onSetCorrectOption={handleSetCorrectOption}
          onAddOption={handleAddOption}
          onRemoveOption={handleRemoveOption}
        />
      )}

      {step === 3 && (
        <ExamReviewStep exam={exam} questions={questions} />
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {step < 3 ? (
          <Button onClick={() => {
            if (step === 1 && !validateStep1()) return;
            if (step === 2 && !validateStep2()) return;
            setStep(step + 1);
          }}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Exam'}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
