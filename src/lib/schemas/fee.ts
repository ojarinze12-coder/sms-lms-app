import { z } from 'zod';

export const FeeComponentTypeSchema = z.enum([
  'TUITION',
  'REGISTRATION',
  'EXAM',
  'TRANSPORT',
  'HOSTEL',
  'LIBRARY',
  'UNIFORM',
  'EXTRA_CURRICULAR',
  'LEVY',
  'BOOK',
  'PTA',
  'OTHER',
]);

export const FeeComponentCategorySchema = z.enum(['MANDATORY', 'OPTIONAL']);

export const CreateFeeComponentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: FeeComponentTypeSchema,
  category: FeeComponentCategorySchema.default('MANDATORY'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  isRecurring: z.boolean().default(false),
  dueDate: z.string().datetime().optional().nullable(),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  termId: z.string().uuid('Invalid term ID').optional().nullable(),
  branchId: z.string().uuid('Invalid branch ID').optional().nullable(),
  tierId: z.string().uuid('Invalid tier ID').optional().nullable(),
});

export const UpdateFeeComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: FeeComponentTypeSchema.optional(),
  category: FeeComponentCategorySchema.optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(255).nullable().optional(),
  isRecurring: z.boolean().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const BulkCreateFeeComponentsSchema = z.object({
  academicYearId: z.string().uuid('Invalid academic year ID'),
  termId: z.string().uuid('Invalid term ID').optional().nullable(),
  branchId: z.string().uuid('Invalid branch ID').optional().nullable(),
  tierId: z.string().uuid('Invalid tier ID').optional().nullable(),
  components: z.array(z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: FeeComponentTypeSchema,
    category: FeeComponentCategorySchema.default('MANDATORY'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().max(255).optional(),
    isRecurring: z.boolean().default(false),
    dueDate: z.string().datetime().optional().nullable(),
  })).min(1, 'At least one component is required'),
});

export const DiscountTypeAppliesToSchema = z.enum(['ALL', 'MANDATORY_ONLY', 'TUITION_ONLY']);

export const CreateDiscountTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(50).toUpperCase(),
  discountPercentage: z.number().min(0).max(100),
  description: z.string().max(255).optional(),
  maxDiscountPerStudent: z.number().min(0).max(100).optional().default(50),
  requiresApproval: z.boolean().default(false),
  appliesTo: DiscountTypeAppliesToSchema.default('ALL'),
});

export const UpdateDiscountTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  description: z.string().max(255).nullable().optional(),
  maxDiscountPerStudent: z.number().min(0).max(100).optional(),
  requiresApproval: z.boolean().optional(),
  appliesTo: DiscountTypeAppliesToSchema.optional(),
  isActive: z.boolean().optional(),
});

export const ApplyStudentDiscountSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  discountTypeId: z.string().uuid('Invalid discount type ID'),
  discountPercentage: z.number().min(0).max(100).optional(),
  reason: z.string().max(255).optional(),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  branchId: z.string().uuid('Invalid branch ID').optional(),
});

export const ApproveRejectDiscountSchema = z.object({
  studentDiscountId: z.string().uuid('Invalid student discount ID'),
  approvalAction: z.enum(['approve', 'reject']),
});

export const UpdateSiblingDiscountSchema = z.object({
  academicYearId: z.string().uuid().optional(),
  linkingMode: z.enum(['AUTO', 'ADMIN_APPROVAL']).optional(),
  isEnabled: z.boolean().optional(),
  secondChildDiscount: z.number().min(0).max(100).optional(),
  thirdChildDiscount: z.number().min(0).max(100).optional(),
  fourthChildDiscount: z.number().min(0).max(100).optional(),
  fifthChildDiscount: z.number().min(0).max(100).optional(),
  maxDiscountPerChild: z.number().min(0).max(100).optional(),
  applyTo: z.enum(['ALL', 'MANDATORY_ONLY', 'TUITION_ONLY']).optional(),
  isActive: z.boolean().optional(),
});

export const SubmitFeeRegistrationSchema = z.object({
  academicYearId: z.string().uuid('Invalid academic year ID'),
  termId: z.string().uuid('Invalid term ID'),
  selectedOptionalComponents: z.array(z.string().uuid('Invalid component ID')),
});

export type SubmitFeeRegistrationInput = z.infer<typeof SubmitFeeRegistrationSchema>;
export type CreateDiscountTypeInput = z.infer<typeof CreateDiscountTypeSchema>;
export type UpdateDiscountTypeInput = z.infer<typeof UpdateDiscountTypeSchema>;
export type ApplyStudentDiscountInput = z.infer<typeof ApplyStudentDiscountSchema>;
export type UpdateSiblingDiscountInput = z.infer<typeof UpdateSiblingDiscountSchema>;