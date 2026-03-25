export interface ExamFormData {
  title: string;
  description: string;
  examType: 'QUIZ' | 'MID_TERM' | 'END_TERM' | 'ASSIGNMENT' | 'PRACTICE' | 'WAEC' | 'NECO' | 'BECE' | 'JAMB_UTME' | 'MOCK';
  duration: number;
  termId: string;
  subjectId: string;
  startTime: string;
  endTime: string;
}

export interface Question {
  tempId: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  points: number;
  order: number;
  options?: Option[];
}

export interface Option {
  content: string;
  isCorrect: boolean;
  order: number;
}

export const examTypes = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'MID_TERM', label: 'Mid Term' },
  { value: 'END_TERM', label: 'End Term' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'WAEC', label: 'WAEC (Senior Secondary)' },
  { value: 'NECO', label: 'NECO' },
  { value: 'BECE', label: 'BECE (JSS3)' },
  { value: 'JAMB_UTME', label: 'JAMB UTME' },
  { value: 'MOCK', label: 'Mock Exam' },
];

export const getInitialExamForm = (): ExamFormData => ({
  title: '',
  description: '',
  examType: 'QUIZ',
  duration: 30,
  termId: '',
  subjectId: '',
  startTime: '',
  endTime: '',
});

export const createNewQuestion = (
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
  order: number
): Question => ({
  tempId: `temp-${Date.now()}-${order}`,
  content: '',
  type,
  points: 1,
  order,
  options: type === 'TRUE_FALSE' 
    ? [
        { content: 'True', isCorrect: false, order: 1 },
        { content: 'False', isCorrect: false, order: 2 },
      ]
    : type === 'MULTIPLE_CHOICE'
    ? [
        { content: '', isCorrect: false, order: 1 },
        { content: '', isCorrect: false, order: 2 },
        { content: '', isCorrect: false, order: 3 },
        { content: '', isCorrect: false, order: 4 },
      ]
    : [],
});
