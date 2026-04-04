-- Add missing tenantId column to subjects table
-- Migration: 20260404_add_subjects_tenantId

-- Step 1: Add tenantId column (nullable first, then we'll backfill)
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "tenantId" UUID;

-- Step 2: Create index for tenant filtering
CREATE INDEX IF NOT EXISTS "idx_subjects_tenant" ON "subjects"("tenantId");

-- Step 3: Backfill tenantId from academic_classes table
UPDATE "subjects" s
SET "tenantId" = ac."tenantId"
FROM "academic_classes" ac
WHERE s."academicClassId" = ac."id"
AND s."tenantId" IS NULL;

-- Step 4: Make column non-nullable after backfill (optional - requires all rows to have tenantId)
-- This step may need to be done manually if there are subjects without academic classes
DO $$
BEGIN
  -- Try to alter column to not null if all rows have tenantId
  ALTER TABLE "subjects" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Ignore if not all rows have tenantId
    NULL;
END $$;