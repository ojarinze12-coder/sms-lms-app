-- ============================================
-- Edunext RLS Policies (Simple Version)
-- Run this AFTER tables are created
-- ============================================

-- Enable RLS on all tables (in case not enabled)
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid duplicates)
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON "tenants";
DROP POLICY IF EXISTS "tenant_isolation_users" ON "users";
DROP POLICY IF EXISTS "tenant_isolation_students" ON "students";
DROP POLICY IF EXISTS "tenant_isolation_teachers" ON "teachers";
DROP POLICY IF EXISTS "tenant_isolation_courses" ON "courses";
DROP POLICY IF EXISTS "tenant_isolation_classes" ON "classes";
DROP POLICY IF EXISTS "tenant_isolation_enrollments" ON "enrollments";
DROP POLICY IF EXISTS "tenant_isolation_invoices" ON "invoices";

-- Create simple RLS policies (allow all for now - app handles filtering)
CREATE POLICY "tenant_isolation_tenants" ON "tenants" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_users" ON "users" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_students" ON "students" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_teachers" ON "teachers" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_courses" ON "courses" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_classes" ON "classes" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_enrollments" ON "enrollments" FOR ALL USING (true);
CREATE POLICY "tenant_isolation_invoices" ON "invoices" FOR ALL USING (true);

-- ============================================
-- RLS Policies applied successfully!
-- ============================================
