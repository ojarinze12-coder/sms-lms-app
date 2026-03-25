export const DEFAULT_SSS_DEPARTMENTS = [
  {
    name: 'Sciences',
    code: 'SCI',
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Further Mathematics',
      'Agricultural Science',
      'Computer Science'
    ]
  },
  {
    name: 'Commercial',
    code: 'COM',
    subjects: [
      'Mathematics',
      'Economics',
      'Accounting',
      'Commerce',
      'Government',
      'Business Studies',
      'Civic Education'
    ]
  },
  {
    name: 'Arts',
    code: 'ART',
    subjects: [
      'Mathematics',
      'Literature in English',
      'Government',
      'History',
      'Geography',
      'Christian Religious Studies',
      'Islamic Religious Studies',
      'Yoruba Language'
    ]
  },
  {
    name: 'Technical',
    code: 'TEC',
    subjects: [
      'Mathematics',
      'Physics',
      'Technical Drawing',
      'Basic Electronics',
      'Computer Science',
      'Engineering'
    ]
  },
] as const;

export const DEPARTMENT_SUBJECT_LIMITS = {
  min: 1,
  max: 15,
} as const;

export function getDepartmentSubjectCount(department: typeof DEFAULT_SSS_DEPARTMENTS[number]): number {
  return department.subjects.length;
}
