export interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: 'QUIZ' | 'MID_TERM' | 'END_TERM' | 'ASSIGNMENT' | 'PRACTICE' | 'WAEC' | 'NECO' | 'BECE' | 'JAMB_UTME' | 'MOCK';
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  duration: number;
  startTime?: string;
  endTime?: string;
  termId: string;
  subjectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  term?: Term;
  subject?: Subject;
  createdBy?: User;
  questions?: Question[];
  questionsCount?: number;
}

export interface Question {
  id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  points: number;
  order: number;
  examId: string;
  options?: Option[];
}

export interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
  questionId: string;
}

export interface Result {
  id: string;
  score: number;
  percentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  examId: string;
  studentId: string;
  exam?: Exam;
  student?: Student;
  rank?: number;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  academicYearId: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  academicClassId: string;
  teacherId?: string;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  name: string;
  level: number;
  capacity: number;
  academicYearId: string;
}
