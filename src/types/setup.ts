import type { Curriculum } from '@prisma/client';
import type { TenantSettings, Tier, Department } from './index';

export interface TierWithCount extends Tier {
  _count?: {
    classes: number;
    departments: number;
  };
}

export interface DepartmentWithCount extends Department {
  _count?: {
    subjects: number;
    classes: number;
  };
}

export interface TierCurriculum {
  tierId: string;
  curriculum: Curriculum;
  tier?: {
    name: string;
    code: string;
  };
}

export interface SetupWizardProps {
  existingTiers: TierWithCount[];
  existingDepartments: DepartmentWithCount[];
  settings: TenantSettings | null;
  curriculum: Curriculum;
  usePerTierCurriculum: boolean;
  tierCurriculum: Record<string, Curriculum>;
  selectedDepts: string[];
  badgesEnabled: boolean;
  badgesAutoAward: boolean;
  badgesShowOnReport: boolean;
  daysPerWeek: number;
  periodDuration: number;
  schoolStartTime: string;
  schoolEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  submitting: boolean;
  error: string;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  onSubmitting: (submitting: boolean) => void;
  onReloadData: () => void;
}

export interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  onSubmitting: (submitting: boolean) => void;
}
