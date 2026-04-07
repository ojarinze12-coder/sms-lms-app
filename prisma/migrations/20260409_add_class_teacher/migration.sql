-- Migration: Add Class Teacher field
-- Date: April 9, 2026

-- Add class_teacher_id column to academic_classes
ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "class_teacher_id" UUID;

-- Add foreign key constraint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_class_teacher_id_fkey" 
    FOREIGN KEY ("class_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS "idx_academic_classes_class_teacher" ON "academic_classes"("class_teacher_id");
