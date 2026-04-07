-- Migration: Add Teacher positions and Class role assignments
-- Date: April 8, 2026

-- 1. Add position and department_id to teachers table
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "position" VARCHAR(50);
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "department_id" UUID;

-- 2. Add form_master_id and caregiver_id to academic_classes table
ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "form_master_id" UUID;
ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "caregiver_id" UUID;
ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "class_teacher_id" UUID;

-- 3. Add foreign key constraints
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_form_master_id_fkey" 
    FOREIGN KEY ("form_master_id") REFERENCES "teachers"("id") ON DELETE SET NULL;

ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_caregiver_id_fkey" 
    FOREIGN KEY ("caregiver_id") REFERENCES "staff"("id") ON DELETE SET NULL;

ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_class_teacher_id_fkey" 
    FOREIGN KEY ("class_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;

ALTER TABLE "teachers" ADD CONSTRAINT "teachers_department_id_fkey" 
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_teachers_position" ON "teachers"("position");
CREATE INDEX IF NOT EXISTS "idx_teachers_department" ON "teachers"("department_id");
CREATE INDEX IF NOT EXISTS "idx_academic_classes_form_master" ON "academic_classes"("form_master_id");
CREATE INDEX IF NOT EXISTS "idx_academic_classes_caregiver" ON "academic_classes"("caregiver_id");
CREATE INDEX IF NOT EXISTS "idx_academic_classes_class_teacher" ON "academic_classes"("class_teacher_id");

-- 5. Update StaffCategory enum values (PostgreSQL enum type update)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffCategory') THEN
        CREATE TYPE "StaffCategory" AS ENUM (
            'TEACHING',
            'CAREGIVER',
            'ADMINISTRATIVE',
            'BURSAR',
            'LIBRARIAN',
            'SECURITY',
            'CLEANER',
            'DRIVER',
            'COOK',
            'MAINTENANCE',
            'IT_SUPPORT',
            'COUNSELOR',
            'NURSE',
            'OTHER'
        );
    ELSE
        -- Add new enum values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TEACHING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'StaffCategory')) THEN
            ALTER TYPE "StaffCategory" ADD VALUE 'TEACHING';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CAREGIVER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'StaffCategory')) THEN
            ALTER TYPE "StaffCategory" ADD VALUE 'CAREGIVER';
        END IF;
    END IF;
END $$;

-- 6. Update UserRole enum values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM (
            'ADMIN',
            'TEACHER',
            'STUDENT',
            'PARENT',
            'SUPER_ADMIN',
            'PRINCIPAL',
            'VICE_PRINCIPAL',
            'ACADEMIC_ADMIN',
            'FINANCE_ADMIN',
            'BURSAR',
            'SENIOR_TEACHER',
            'HOD',
            'FORM_MASTER'
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SENIOR_TEACHER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
            ALTER TYPE "UserRole" ADD VALUE 'SENIOR_TEACHER';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'HOD' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
            ALTER TYPE "UserRole" ADD VALUE 'HOD';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FORM_MASTER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
            ALTER TYPE "UserRole" ADD VALUE 'FORM_MASTER';
        END IF;
    END IF;
END $$;
