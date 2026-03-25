'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { examApi } from '@/lib/api';
import type { Exam, Question, Answer } from '@/types/exam-take';
import ExamStartScreen from '@/components/exam-take/ExamStartScreen';
import ExamHeader from '@/components/exam-take/ExamHeader';
import QuestionNavigator from '@/components/exam-take/QuestionNavigator';
import QuestionDisplay from '@/components/exam-take/QuestionDisplay';

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  const examId = params.id as string;

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (exam && examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, examStarted, timeLeft]);

  const loadExam = async () => {
    try {
      const data = await examApi.get(examId);
      setExam(data);
      setTimeLeft(data.duration * 60);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load exam',
      });
      router.push('/lms/exams');
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, { questionId, optionId });
    setAnswers(newAnswers);
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, { questionId, textAnswer: text });
    setAnswers(newAnswers);
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from(answers.values()).filter(a => a.optionId || a.textAnswer);
      await examApi.submit(examId, answersArray);
      toast({
        title: 'Success',
        description: 'Exam submitted successfully',
      });
      router.push('/lms/results');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit exam',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) return null;

  const questions = exam.questions || [];
  const currentQ = questions[currentQuestion];

  // Show start screen
  if (!examStarted) {
    return <ExamStartScreen exam={exam} onStart={startExam} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ExamHeader
        title={exam.title}
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              onSelectQuestion={setCurrentQuestion}
            />
          </div>
          <div className="lg:col-span-3">
            {currentQ && (
              <QuestionDisplay
                question={currentQ}
                currentIndex={currentQuestion}
                totalQuestions={questions.length}
                answers={answers}
                isFlagged={flaggedQuestions.has(currentQuestion)}
                onAnswer={handleAnswer}
                onTextAnswer={handleTextAnswer}
                onToggleFlag={toggleFlag}
                onPrevious={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                onNext={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                canGoPrevious={currentQuestion > 0}
                canGoNext={currentQuestion < questions.length - 1}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
