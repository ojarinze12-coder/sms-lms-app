import { z } from 'zod';
import { Curriculum } from '@prisma/client';

export const TierCodeSchema = z.enum(['CRE', 'PRE_NUR', 'NUR', 'PRI', 'JSS', 'SSS']);

export const CreateTierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  code: z.string().min(1, 'Code is required').max(10).toUpperCase(),
  alias: z.string().max(50).optional(),
  order: z.number().int().min(0),
});

export const UpdateTierSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  alias: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ApplyTierTemplateSchema = z.object({
  template: z.enum([
    'NURSERY_ONLY',
    'PRIMARY_ONLY',
    'SECONDARY_ONLY',
    'NURSERY_TO_PRIMARY',
    'PRIMARY_TO_SSS',
    'NURSERY_TO_SSS',
    'FULL_K12'
  ]),
  curriculum: z.nativeEnum(Curriculum).default('NERDC'),
});

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(10).toUpperCase(),
  alias: z.string().max(100).optional(),
  tierId: z.string().uuid('Invalid tier ID'),
});

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alias: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const TierCurriculumSchema = z.object({
  tierId: z.string().uuid(),
  curriculum: z.nativeEnum(Curriculum),
});

export const TenantCurriculumSettingsSchema = z.object({
  curriculumType: z.nativeEnum(Curriculum),
  usePerTierCurriculum: z.boolean().default(false),
  daysPerWeek: z.number().min(1).max(7).default(5),
  periodDuration: z.number().min(15).max(120).default(40),
  schoolStartTime: z.string().default("08:00"),
  schoolEndTime: z.string().default("15:00"),
  breakStartTime: z.string().default("12:00"),
  breakEndTime: z.string().default("12:30"),
});

export type CreateTierInput = z.infer<typeof CreateTierSchema>;
export type UpdateTierInput = z.infer<typeof UpdateTierSchema>;
export type ApplyTierTemplateInput = z.infer<typeof ApplyTierTemplateSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type TierCurriculumInput = z.infer<typeof TierCurriculumSchema>;
export type TenantCurriculumSettingsInput = z.infer<typeof TenantCurriculumSettingsSchema>;
