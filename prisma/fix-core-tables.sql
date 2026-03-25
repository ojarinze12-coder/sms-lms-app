-- =====================================================
-- COMPLETE FIX: Recreate core tables with correct types
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop existing tables (if any)
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;

-- 2. Create enum types
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'BURSAR', 'TEACHER', 'STUDENT', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Recreate tenants table (with logo support)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "domain" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "brandColor" TEXT NOT NULL DEFAULT '#1a56db',
    "logo" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recreate users table with enum
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enable RLS
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON "tenants";
CREATE POLICY "tenant_isolation_tenants" ON "tenants" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_users" ON "users";
CREATE POLICY "tenant_isolation_users" ON "users" FOR ALL USING (true);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

SELECT 'Tables recreated successfully! UserRole enum and all.' as result;
