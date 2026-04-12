import { Exam, Question, Result } from '@/types/exam';

const API_BASE = '/api/lms';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
}

// Exam APIs
export const examApi = {
  list: (params?: { termId?: string; subjectId?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.termId) searchParams.set('termId', params.termId);
    if (params?.subjectId) searchParams.set('subjectId', params.subjectId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return fetchApi<Exam[]>(`${API_BASE}/exams${query ? `?${query}` : ''}`);
  },

  get: (id: string) => fetchApi<Exam>(`${API_BASE}/exams/${id}`),

  create: (data: Partial<Exam>) =>
    fetchApi<Exam>(`${API_BASE}/exams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Exam>) =>
    fetchApi<Exam>(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`${API_BASE}/exams/${id}`, { method: 'DELETE' }),

  publish: (id: string) =>
    fetchApi<Exam>(`${API_BASE}/exams/${id}/publish`, { method: 'POST' }),

  // Questions
  getQuestions: (examId: string) =>
    fetchApi<Question[]>(`${API_BASE}/exams/${examId}/questions`),

  addQuestion: (examId: string, data: Partial<Question> & { options?: any[] }) =>
    fetchApi<Question>(`${API_BASE}/exams/${examId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuestion: (examId: string, questionId: string, data: Partial<Question> & { options?: any[] }) =>
    fetchApi<Question>(`${API_BASE}/exams/${examId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteQuestion: (examId: string, questionId: string) =>
    fetchApi<void>(`${API_BASE}/exams/${examId}/questions/${questionId}`, { method: 'DELETE' }),

  // Submit exam
  submit: (examId: string, answers: { questionId: string; optionId?: string; textAnswer?: string }[]) =>
    fetchApi<{ success: boolean; resultId: string }>(`${API_BASE}/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Grade exam
  grade: (examId: string) =>
    fetchApi<{ success: boolean; gradedCount: number; results: any[] }>(
      `${API_BASE}/exams/${examId}/grade`,
      { method: 'POST' }
    ),

  // Results
  getExamResults: (examId: string) =>
    fetchApi<Result[]>(`${API_BASE}/exams/${examId}/results`),
};

// Results APIs
export const resultsApi = {
  list: (params?: { examId?: string; studentId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.examId) searchParams.set('examId', params.examId);
    if (params?.studentId) searchParams.set('studentId', params.studentId);
    
    const query = searchParams.toString();
    return fetchApi<Result[]>(`${API_BASE}/results${query ? `?${query}` : ''}`);
  },

  get: (id: string) => fetchApi<any>(`${API_BASE}/results/${id}`),
};

// Academic APIs
export const academicApi = {
  getTerms: () => fetchApi<any[]>(`/api/sms/terms`),
  getSubjects: () => fetchApi<any[]>(`/api/sms/subjects`),
  getAcademicYears: () => fetchApi<any[]>(`/api/sms/academic-years`),
  getAcademicClasses: () => fetchApi<any[]>(`/api/sms/academic-classes`),
};
