export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number;
  status: string;
  questions?: Question[];
  startTime?: string;
  endTime?: string;
}

export interface Question {
  id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  points: number;
  order: number;
  options?: Option[];
}

export interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface Answer {
  questionId: string;
  optionId?: string;
  textAnswer?: string;
}
