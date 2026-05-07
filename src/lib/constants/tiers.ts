import { Curriculum } from '@prisma/client';

// Early Childhood tiers (NOT part of K1-12 academic levels)
export const EARLY_CHILDHOOD_TIERS = {
  CRECHE: { name: 'Creche', code: 'CRE', order: 0 },
  PRE_NURSERY: { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
  NURSERY: { name: 'Nursery', code: 'NUR', order: 2 },
} as const;

// K1-12 Academic tiers (Level 1-12)
export const K12_ACADEMIC_TIERS = {
  PRIMARY: { name: 'Primary', code: 'PRI', order: 3 },
  JSS: { name: 'JSS', code: 'JSS', order: 4 },
  SSS: { name: 'SSS', code: 'SSS', order: 5 },
} as const;

export const TIER_TEMPLATES = {
  // Early Childhood only (NOT part of K1-12)
  EARLY_CHILDHOOD_ONLY: [
    { name: 'Creche', code: 'CRE', order: 0 },
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
  ],
  NURSERY_ONLY: [
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
  ],
  // K1-12 Academic only (Primary to SSS - Level 1-12)
  PRIMARY_ONLY: [
    { name: 'Primary', code: 'PRI', order: 1 },
  ],
  PRIMARY_TO_JSS: [
    { name: 'Primary', code: 'PRI', order: 1 },
    { name: 'JSS', code: 'JSS', order: 2 },
  ],
  PRIMARY_TO_SSS: [
    { name: 'Primary', code: 'PRI', order: 1 },
    { name: 'JSS', code: 'JSS', order: 2 },
    { name: 'SSS', code: 'SSS', order: 3 },
  ],
  // Full: Early Childhood + K1-12
  EARLY_CHILDHOOD_TO_PRIMARY: [
    { name: 'Creche', code: 'CRE', order: 0 },
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'Primary', code: 'PRI', order: 3 },
  ],
  EARLY_CHILDHOOD_TO_SSS: [
    { name: 'Creche', code: 'CRE', order: 0 },
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'Primary', code: 'PRI', order: 3 },
    { name: 'JSS', code: 'JSS', order: 4 },
    { name: 'SSS', code: 'SSS', order: 5 },
  ],
  // Legacy K12 (for backward compatibility)
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

export const TIER_TEMPLATE_OPTIONS = [
  // Early Childhood only (NOT part of K1-12)
  { value: 'EARLY_CHILDHOOD_ONLY', label: 'Early Childhood Only (Creche, Pre-Nursery, Nursery)' },
  { value: 'NURSERY_ONLY', label: 'Nursery Only (Pre-Nursery, Nursery)' },
  // K1-12 Academic only (Primary to SSS)
  { value: 'PRIMARY_ONLY', label: 'Primary Only (Primary 1-6)' },
  { value: 'PRIMARY_TO_JSS', label: 'Primary to JSS (Primary 1 to JSS 3)' },
  { value: 'PRIMARY_TO_SSS', label: 'Primary to SSS (K1-12: Primary 1 to SSS 3)' },
  // Full: Early Childhood + K1-12
  { value: 'EARLY_CHILDHOOD_TO_PRIMARY', label: 'Early Childhood to Primary' },
  { value: 'EARLY_CHILDHOOD_TO_SSS', label: 'Early Childhood to SSS (Full School)' },
  // Legacy
  { value: 'FULL_K12', label: 'Full K-12 (Legacy - includes Pre-Nursery/Nursery)' },
] as const;

export const DEFAULT_TIER_CODES = ['CRE', 'PRE_NUR', 'NUR', 'PRI', 'JSS', 'SSS'] as const;

export const SSS_TIER_CODE = 'SSS' as const;
export const PRIMARY_TIER_CODE = 'PRI' as const;
export const JSS_TIER_CODE = 'JSS' as const;

export const EARLY_CHILDHOOD_CODES = ['CRE', 'PRE_NUR', 'NUR'] as const;
export const K12_TIER_CODES = ['PRI', 'JSS', 'SSS'] as const;

export function isSSSTier(tierCode: string): boolean {
  return tierCode === SSS_TIER_CODE;
}

export function isPrimaryTier(tierCode: string): boolean {
  return tierCode === PRIMARY_TIER_CODE;
}

export function isJssTier(tierCode: string): boolean {
  return tierCode === JSS_TIER_CODE;
}

export function isEarlyChildhoodTier(tierCode: string): boolean {
  return EARLY_CHILDHOOD_CODES.includes(tierCode as typeof EARLY_CHILDHOOD_CODES[number]);
}

export function isK12AcademicTier(tierCode: string): boolean {
  return K12_TIER_CODES.includes(tierCode as typeof K12_TIER_CODES[number]);
}

export function getTierDisplayName(tier: { name: string; alias?: string | null }): string {
  return tier.alias || tier.name;
}
