import { UserRole, EnrollmentStatus, Semester, Gender, InvoiceStatus, Curriculum } from '@prisma/client';

export type { UserRole, EnrollmentStatus, Semester, Gender, InvoiceStatus };
export { Curriculum } from '@prisma/client';

export type Plan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  plan: Plan;
  brandColor: string;
  logo?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  tenantId: string;
}

export interface AuthUser extends User {
  tenant: Tenant;
}

// Tier System Types

export interface Tier {
  id: string;
  name: string;
  code: string;
  alias?: string | null;
  order: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    classes: number;
    departments: number;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  alias?: string | null;
  isActive: boolean;
  tierId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  tier?: Tier;
  _count?: {
    subjects: number;
    classes: number;
  };
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  curriculumType: Curriculum;
  usePerTierCurriculum: boolean;
  tiersSetupComplete: boolean;
  daysPerWeek: number;
  periodDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierCurriculum {
  id: string;
  tierId: string;
  curriculum: Curriculum;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tier Templates for Setup
export const TIER_TEMPLATES = {
  NURSERY_ONLY: [
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
  ],
  PRIMARY_ONLY: [
    { name: 'Primary', code: 'PRI', order: 3 },
  ],
  SECONDARY_ONLY: [
    { name: 'JSS', code: 'JSS', order: 4 },
    { name: 'SSS', code: 'SSS', order: 5 },
  ],
  NURSERY_TO_PRIMARY: [
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'Primary', code: 'PRI', order: 3 },
  ],
  PRIMARY_TO_SSS: [
    { name: 'Primary', code: 'PRI', order: 3 },
    { name: 'JSS', code: 'JSS', order: 4 },
    { name: 'SSS', code: 'SSS', order: 5 },
  ],
  NURSERY_TO_SSS: [
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'Primary', code: 'PRI', order: 3 },
    { name: 'JSS', code: 'JSS', order: 4 },
    { name: 'SSS', code: 'SSS', order: 5 },
  ],
  FULL_K12: [
    { name: 'Creche', code: 'CRE', order: 0 },
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'Primary', code: 'PRI', order: 3 },
    { name: 'JSS', code: 'JSS', order: 4 },
    { name: 'SSS', code: 'SSS', order: 5 },
  ],
} as const;

export type TierTemplate = keyof typeof TIER_TEMPLATES;

// Default SSS Departments
export const DEFAULT_SSS_DEPARTMENTS = [
  {
    name: 'Sciences',
    code: 'SCI',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Agricultural Science', 'Computer Science']
  },
  {
    name: 'Commercial',
    code: 'COM',
    subjects: ['Mathematics', 'Economics', 'Accounting', 'Commerce', 'Government', 'Business Studies', 'Civic Education']
  },
  {
    name: 'Arts',
    code: 'ART',
    subjects: ['Mathematics', 'Literature in English', 'Government', 'History', 'Geography', 'Christian Religious Studies', 'Islamic Religious Studies', 'Yoruba Language']
  },
  {
    name: 'Technical',
    code: 'TEC',
    subjects: ['Mathematics', 'Physics', 'Technical Drawing', 'Basic Electronics', 'Computer Science', 'Engineering']
  },
] as const;

// Curriculum Display Names
export const CURRICULUM_INFO: Record<Curriculum, { name: string; description: string }> = {
  NERDC: {
    name: 'NERDC (Nigeria)',
    description: 'Nigerian Educational Research and Development Council curriculum'
  },
  CAMBRIDGE: {
    name: 'Cambridge International',
    description: 'Cambridge International Examinations curriculum (IGCSE, AS/A Levels)'
  },
  AMERICAN: {
    name: 'American Curriculum',
    description: 'US-based curriculum with Common Core standards'
  },
  IB: {
    name: 'IB (International Baccalaureate)',
    description: 'International Baccalaureate Primary, Middle Years, and Diploma Programme'
  },
};
