import { Curriculum } from '@prisma/client';

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

export const TIER_TEMPLATE_OPTIONS = [
  { value: 'NURSERY_ONLY', label: 'Nursery Only (Pre-Nursery, Nursery)' },
  { value: 'PRIMARY_ONLY', label: 'Primary Only' },
  { value: 'SECONDARY_ONLY', label: 'Secondary Only (JSS, SSS)' },
  { value: 'NURSERY_TO_PRIMARY', label: 'Nursery to Primary (Pre-Nursery, Nursery, Primary)' },
  { value: 'PRIMARY_TO_SSS', label: 'Primary to SSS (Primary, JSS, SSS)' },
  { value: 'NURSERY_TO_SSS', label: 'Nursery to SSS (Pre-Nursery to SSS 3)' },
  { value: 'FULL_K12', label: 'Full K-12 (Creche to SSS 3)' },
] as const;

export const DEFAULT_TIER_CODES = ['CRE', 'PRE_NUR', 'NUR', 'PRI', 'JSS', 'SSS'] as const;

export const SSS_TIER_CODE = 'SSS' as const;

export function isSSSTier(tierCode: string): boolean {
  return tierCode === SSS_TIER_CODE;
}

export function getTierDisplayName(tier: { name: string; alias?: string | null }): string {
  return tier.alias || tier.name;
}
