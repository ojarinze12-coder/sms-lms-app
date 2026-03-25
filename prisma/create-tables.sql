-- ============================================
-- Edunext Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================

-- Create enum types
DO $$ BEGIN
    CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Semester" AS ENUM ('FALL', 'SPRING', 'SUMMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "domain" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "brandColor" TEXT NOT NULL DEFAULT '#1a56db',
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create students table
CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phone" TEXT,
    "address" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "students_tenantId_studentId_unique" UNIQUE ("tenantId", "studentId")
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS "teachers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employeeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "phone" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teachers_tenantId_employeeId_unique" UNIQUE ("tenantId", "employeeId")
);

-- Create staff table (Non-Teaching Staff)
CREATE TABLE IF NOT EXISTS "staff" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employeeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "phone" TEXT,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "address" TEXT,
    "stateOfOrigin" TEXT,
    "lgaOfOrigin" TEXT,
    "photo" TEXT,
    "qualification" TEXT,
    "experience" INTEGER,
    "joinDate" DATE,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "department" TEXT,
    "position" TEXT,
    "salary" DOUBLE PRECISION,
    "pensionPin" TEXT,
    "nhfNumber" TEXT,
    "bvn" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankSortCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_tenantId_employeeId_unique" UNIQUE ("tenantId", "employeeId")
);

-- Create courses table
CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "teacherId" TEXT NOT NULL REFERENCES "teachers"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_tenantId_code_unique" UNIQUE ("tenantId", "code")
);

-- Create classes table
CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" "Semester" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "courseId" TEXT NOT NULL REFERENCES "courses"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "classes_tenantId_courseId_year_semester_unique" UNIQUE ("tenantId", "courseId", "year", "semester")
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS "enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "students"("id"),
    "classId" TEXT NOT NULL REFERENCES "classes"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enrollments_tenantId_studentId_classId_unique" UNIQUE ("tenantId", "studentId", "classId")
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "students_tenantId_idx" ON "students"("tenantId");
CREATE INDEX IF NOT EXISTS "teachers_tenantId_idx" ON "teachers"("tenantId");
CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");
CREATE INDEX IF NOT EXISTS "classes_tenantId_idx" ON "classes"("tenantId");
CREATE INDEX IF NOT EXISTS "enrollments_tenantId_idx" ON "enrollments"("tenantId");
CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON "invoices"("tenantId");

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tenant_isolation_tenants" ON "tenants" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_users" ON "users" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_students" ON "students" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_teachers" ON "teachers" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_courses" ON "courses" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_classes" ON "classes" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_enrollments" ON "enrollments" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_invoices" ON "invoices" FOR ALL USING (true);

-- ============================================
-- Schema created successfully!
-- ============================================
