-- Add missing tenantId column to subjects table
-- This fixes the auto-create subjects feature

-- Add tenantId column
ALTER TABLE "subjects" 
ADD COLUMN IF NOT EXISTS "tenantId" UUID;

-- Add foreign key constraint (optional - won't work if tenants table has different structure)
-- First check if we can add the FK
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subjects' AND column_name = 'tenantId'
  ) THEN
    -- Add index for tenant filtering
    CREATE INDEX IF NOT EXISTS "idx_subjects_tenant" ON "subjects"("tenantId");
  END IF;
END $$;

-- Note: Run this SQL directly in Supabase SQL Editor
-- After running, verify with: SELECT * FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'tenantId';