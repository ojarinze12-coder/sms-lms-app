-- Migration: Add Tier System (Phase 11)
-- Date: March 19, 2026

-- 1. Add Curriculum enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "Curriculum" AS ENUM ('NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tier table
CREATE TABLE IF NOT EXISTS "tiers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "alias" VARCHAR(255),
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "tenantId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "tiers_tenantId_code_unique" UNIQUE ("tenantId", "code")
);

CREATE INDEX IF NOT EXISTS "idx_tiers_tenant" ON "tiers"("tenantId");

-- 3. Create Department table
CREATE TABLE IF NOT EXISTS "departments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "alias" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "tierId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "departments_tenantId_code_unique" UNIQUE ("tenantId", "code"),
    CONSTRAINT "departments_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "tiers"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_departments_tenant" ON "departments"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_departments_tier" ON "departments"("tierId");

-- 4. Create TierCurriculum table
CREATE TABLE IF NOT EXISTS "tier_curriculum" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tierId" UUID NOT NULL UNIQUE,
    "curriculum" "Curriculum" NOT NULL DEFAULT 'NERDC',
    "tenantId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "tier_curriculum_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "tiers"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_tier_curriculum_tenant" ON "tier_curriculum"("tenantId");

-- 5. Create TenantSettings table
CREATE TABLE IF NOT EXISTS "tenant_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL UNIQUE,
    "curriculumType" "Curriculum" DEFAULT 'NERDC',
    "usePerTierCurriculum" BOOLEAN DEFAULT false,
    "tiersSetupComplete" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- 6. Add columns to AcademicClass
ALTER TABLE "academic_classes" 
ADD COLUMN IF NOT EXISTS "tierId" UUID,
ADD COLUMN IF NOT EXISTS "departmentId" UUID;

-- Add foreign keys
ALTER TABLE "academic_classes" 
ADD CONSTRAINT "academic_classes_tierId_fkey" 
FOREIGN KEY ("tierId") REFERENCES "tiers"("id") ON DELETE SET NULL;

ALTER TABLE "academic_classes" 
ADD CONSTRAINT "academic_classes_departmentId_fkey" 
FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_academic_classes_tier" ON "academic_classes"("tierId");

-- 7. Add columns to Subject
ALTER TABLE "subjects" 
ADD COLUMN IF NOT EXISTS "departmentId" UUID,
ADD COLUMN IF NOT EXISTS "curriculum" "Curriculum" DEFAULT 'NERDC';

-- Add foreign key for subject department
ALTER TABLE "subjects" 
ADD CONSTRAINT "subjects_departmentId_fkey" 
FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS "idx_subjects_department" ON "subjects"("departmentId");

-- 8. Add TIER_SETUP to OnboardingTaskKey enum
DO $$ BEGIN
    ALTER TYPE "OnboardingTaskKey" ADD VALUE 'TIER_SETUP';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Done
