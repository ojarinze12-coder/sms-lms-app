-- Migration: Convert FeeType from ENUM to dynamic table
-- Created: 2025-06-21

-- Step 1: Create fee_types table
CREATE TABLE "fee_types" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "code" varchar(50) NOT NULL,
    "name" varchar(100) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "tenantId" uuid NOT NULL,
    "branchId" uuid,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "fee_types_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes and constraints
CREATE UNIQUE INDEX "fee_types_tenantId_code_unique" ON "fee_types"("tenantId", "code");
CREATE INDEX "idx_fee_types_tenant" ON "fee_types"("tenantId");
CREATE INDEX "idx_fee_types_branch" ON "fee_types"("branchId");

-- Step 3: Add foreign key constraints
ALTER TABLE "fee_types" ADD CONSTRAINT "fee_types_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "fee_types" ADD CONSTRAINT "fee_types_branchId_fkey" 
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Step 4: Seed fee types for each tenant that has fee components
-- This uses a CTE to find all tenants with fee_components and inserts default types
INSERT INTO "fee_types" ("code", "name", "tenantId", "isActive")
SELECT DISTINCT ft.code, ft.name, t.id, true
FROM (
    VALUES 
        ('TUITION', 'Tuition'),
        ('REGISTRATION', 'Registration'),
        ('EXAMINATION', 'Examination'),
        ('TRANSPORT', 'Transport'),
        ('HOSTEL', 'Hostel'),
        ('LIBRARY', 'Library'),
        ('LABORATORY', 'Laboratory'),
        ('UNIFORM', 'Uniform'),
        ('EXTRA_CURRICULAR', 'Extra Curricular'),
        ('SPORTS', 'Sports'),
        ('LEVY', 'Levy'),
        ('BOOK', 'Book'),
        ('PTA', 'PTA'),
        ('NEWSLETTER', 'Newsletter'),
        ('DEVELOPMENT', 'Development'),
        ('OTHER', 'Other')
) AS ft(code, name)
CROSS JOIN (
    SELECT DISTINCT "tenantId" FROM "fee_components"
    UNION
    SELECT DISTINCT "tenantId" FROM "fee_structures"
) AS t
ON CONFLICT ("tenantId", "code") DO NOTHING;

-- Step 5: Add tenant relation to tenants (no-op if column exists, handled by Prisma)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'feeTypes'
    ) THEN
        -- Add a placeholder column that Prisma will manage
        ALTER TABLE "tenants" ADD COLUMN "feeTypes" uuid[];
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Column might already exist or other issue - skip
    NULL;
END $$;

-- Step 6: Convert fee_components.type from enum to text
ALTER TABLE "fee_components" ALTER COLUMN "type" TYPE varchar(50) 
    USING CASE WHEN "type"::text = '' THEN 'OTHER' ELSE "type"::text END;
ALTER TABLE "fee_components" ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- Step 7: Convert fee_structures.type from enum to text
ALTER TABLE "fee_structures" ALTER COLUMN "type" TYPE varchar(50) 
    USING CASE WHEN "type"::text = '' THEN 'OTHER' ELSE "type"::text END;
ALTER TABLE "fee_structures" ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- Step 8: Convert fee_bill_items.componentType from enum to text
ALTER TABLE "fee_bill_items" ALTER COLUMN "componentType" TYPE varchar(50) 
    USING CASE WHEN "componentType"::text = '' THEN 'OTHER' ELSE "componentType"::text END;
ALTER TABLE "fee_bill_items" ALTER COLUMN "componentType" SET DEFAULT 'OTHER';

-- Step 9: Drop the old FeeType enum (safe now that no columns use it)
DROP TYPE IF EXISTS "FeeType";