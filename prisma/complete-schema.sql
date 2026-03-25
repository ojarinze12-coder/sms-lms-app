-- =====================================================
-- EDUNEXT SMS-LMS - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (all at once)
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'BURSAR', 'TEACHER', 'STUDENT', 'PARENT');
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

DO $$ BEGIN
    CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeeType" AS ENUM ('TUITION', 'REGISTRATION', 'EXAM', 'TRANSPORT', 'HOSTEL', 'LIBRARY', 'UNIFORM', 'EXTRA_CURRICULAR', 'LEVY', 'BOOK', 'PTA', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeeCategory" AS ENUM ('MANDATORY', 'OPTIONAL', 'INSTALLMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'USSD', 'CHEQUE', 'WAIVER', 'POS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CORE TABLES (Required for School Registration)
-- =====================================================

-- Tenants (Schools)
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

-- Users
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

-- Students
CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "phone" TEXT,
    "address" TEXT,
    "stateOfOrigin" TEXT,
    "lgaOfOrigin" TEXT,
    "birthCertNo" TEXT,
    "jambRegNo" TEXT,
    "bloodGroup" TEXT,
    "genotype" TEXT,
    "allergies" TEXT,
    "medicalConditions" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "photo" TEXT,
    "status" "StudentStatus" DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "students_tenantId_studentId_unique" UNIQUE ("tenantId", "studentId")
);

-- Teachers
CREATE TABLE IF NOT EXISTS "teachers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employeeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "address" TEXT,
    "stateOfOrigin" TEXT,
    "lgaOfOrigin" TEXT,
    "qualification" TEXT,
    "experience" INTEGER,
    "joinDate" DATE,
    "employmentType" TEXT DEFAULT 'FULL_TIME',
    "department" TEXT,
    "position" TEXT,
    "salary" DOUBLE PRECISION,
    "pensionPin" TEXT,
    "nhfNumber" TEXT,
    "bvn" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankSortCode" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teachers_tenantId_employeeId_unique" UNIQUE ("tenantId", "employeeId")
);

-- Academic Years
CREATE TABLE IF NOT EXISTS "academic_years" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN DEFAULT false,
    "tenantId" TEXT REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", name)
);

-- Terms
CREATE TABLE IF NOT EXISTS "terms" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isCurrent" BOOLEAN DEFAULT false,
    "academicYearId" TEXT REFERENCES "academic_years"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicYearId", name)
);

-- Academic Classes
CREATE TABLE IF NOT EXISTS "academic_classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "capacity" INTEGER DEFAULT 40,
    "academicYearId" TEXT REFERENCES "academic_years"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicYearId", name)
);

-- Subjects
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "academicClassId" TEXT REFERENCES "academic_classes"("id") ON DELETE CASCADE,
    "teacherId" TEXT REFERENCES "teachers"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicClassId", code)
);

-- Courses
CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "teacherId" TEXT NOT NULL REFERENCES "teachers"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_tenantId_code_unique" UNIQUE ("tenantId", "code")
);

-- Classes (for LMS)
CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" "Semester" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "courseId" TEXT NOT NULL REFERENCES "courses"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "classes_tenantId_courseId_year_semester_unique" UNIQUE ("tenantId", "courseId", "year", "semester")
);

-- Enrollments
CREATE TABLE IF NOT EXISTS "enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "students"("id"),
    "classId" TEXT NOT NULL REFERENCES "classes"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enrollments_tenantId_studentId_classId_unique" UNIQUE ("tenantId", "studentId", "classId")
);

-- Invoices
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "plan" TEXT DEFAULT 'FREE',
    "status" TEXT DEFAULT 'ACTIVE',
    "tenantId" TEXT REFERENCES "tenants"("id") ON DELETE CASCADE UNIQUE,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
    "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
    "features" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. ADDITIONAL TABLES (For Full Functionality)
-- =====================================================

-- Fee Structures
CREATE TABLE IF NOT EXISTS "fee_structures" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "FeeType" NOT NULL,
    "category" "FeeCategory" DEFAULT 'MANDATORY',
    "isRecurring" BOOLEAN DEFAULT false,
    "installments" INTEGER DEFAULT 1,
    "dueDate" DATE,
    "academicYearId" TEXT NOT NULL,
    "termId" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Payments
CREATE TABLE IF NOT EXISTS "fee_payments" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "referenceNo" TEXT,
    "transactionId" TEXT,
    "paymentGateway" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "studentId" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", "referenceNo")
);

-- Attendance
CREATE TABLE IF NOT EXISTS "attendances" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "lateMinutes" INTEGER,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", date, "classId")
);

-- Announcements
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT DEFAULT 'GENERAL',
    "targetRoles" TEXT[],
    "priority" TEXT DEFAULT 'NORMAL',
    "publishAt" TIMESTAMP WITH TIME ZONE,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "isPublished" BOOLEAN DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academic_years" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "terms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academic_classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fee_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fee_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allow all - app handles filtering)
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON "tenants";
CREATE POLICY "tenant_isolation_tenants" ON "tenants" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_users" ON "users";
CREATE POLICY "tenant_isolation_users" ON "users" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_students" ON "students";
CREATE POLICY "tenant_isolation_students" ON "students" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_teachers" ON "teachers";
CREATE POLICY "tenant_isolation_teachers" ON "teachers" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_academic_years" ON "academic_years";
CREATE POLICY "tenant_isolation_academic_years" ON "academic_years" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_terms" ON "terms";
CREATE POLICY "tenant_isolation_terms" ON "terms" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_academic_classes" ON "academic_classes";
CREATE POLICY "tenant_isolation_academic_classes" ON "academic_classes" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_subjects" ON "subjects";
CREATE POLICY "tenant_isolation_subjects" ON "subjects" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_courses" ON "courses";
CREATE POLICY "tenant_isolation_courses" ON "courses" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_classes" ON "classes";
CREATE POLICY "tenant_isolation_classes" ON "classes" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_enrollments" ON "enrollments";
CREATE POLICY "tenant_isolation_enrollments" ON "enrollments" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_invoices" ON "invoices";
CREATE POLICY "tenant_isolation_invoices" ON "invoices" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_subscriptions" ON "subscriptions";
CREATE POLICY "tenant_isolation_subscriptions" ON "subscriptions" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_fee_structures" ON "fee_structures";
CREATE POLICY "tenant_isolation_fee_structures" ON "fee_structures" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_fee_payments" ON "fee_payments";
CREATE POLICY "tenant_isolation_fee_payments" ON "fee_payments" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_attendances" ON "attendances";
CREATE POLICY "tenant_isolation_attendances" ON "attendances" FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_isolation_announcements" ON "announcements";
CREATE POLICY "tenant_isolation_announcements" ON "announcements" FOR ALL USING (true);

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "students_tenantId_idx" ON "students"("tenantId");
CREATE INDEX IF NOT EXISTS "teachers_tenantId_idx" ON "teachers"("tenantId");
CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");
CREATE INDEX IF NOT EXISTS "classes_tenantId_idx" ON "classes"("tenantId");
CREATE INDEX IF NOT EXISTS "enrollments_tenantId_idx" ON "enrollments"("tenantId");
CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON "invoices"("tenantId");

-- =====================================================
-- SCHEMA CREATED SUCCESSFULLY!
-- =====================================================

SELECT 'All tables, RLS policies, and indexes created successfully!' as result;
