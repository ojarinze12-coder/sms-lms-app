-- =====================================================
-- EDUNEXT SMS-LMS SEED DATA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create demo school tenant
INSERT INTO tenants (id, name, slug, plan, "brandColor")
VALUES 
  (gen_random_uuid(), 'Demo School', 'demo-school', 'FREE', '#059669')
ON CONFLICT (slug) DO NOTHING;

-- Get the tenant ID for following inserts
WITH tenant AS (
  SELECT id FROM tenants WHERE slug = 'demo-school' LIMIT 1
)
-- 2. Create Super Admin user
INSERT INTO users (id, email, password, "firstName", "lastName", role, "tenantId")
SELECT 
  gen_random_uuid(), 'superadmin@edunext.com', 'superadmin123', 'Super', 'Admin', 'ADMIN', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT (email) DO NOTHING;

-- 3. Create School Admin  
INSERT INTO users (id, email, password, "firstName", "lastName", role, "tenantId")
SELECT 
  gen_random_uuid(), 'admin@demo-school.com', 'admin123', 'School', 'Admin', 'ADMIN', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT (email) DO NOTHING;

-- 4. Create Teacher
INSERT INTO teachers (id, "employeeId", email, "firstName", "lastName", specialty, phone, "tenantId")
SELECT 
  gen_random_uuid(), 'TCH001', 'teacher@demo-school.com', 'John', 'Smith', 'Mathematics', '+1234567890', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT DO NOTHING;

-- 5. Create Student
INSERT INTO students (id, "studentId", email, "firstName", "lastName", "dateOfBirth", gender, phone, address, "tenantId")
SELECT 
  gen_random_uuid(), 'STU001', 'student@demo-school.com', 'Jane', 'Doe', '2010-05-15', 'FEMALE', '+1234567891', '123 Main St, City', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT DO NOTHING;

-- 6. Create Academic Year
INSERT INTO academic_years (id, name, "startDate", "endDate", "isActive", "tenantId")
SELECT 
  gen_random_uuid(), '2024-2025', '2024-09-01', '2025-06-30', true, id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT DO NOTHING;

-- 7. Create Term
INSERT INTO terms (id, name, "startDate", "endDate", "isCurrent", "academicYearId")
SELECT 
  gen_random_uuid(), 'Fall 2024', '2024-09-01', '2024-12-31', true, id
FROM academic_years WHERE name = '2024-2025'
ON CONFLICT DO NOTHING;

-- 8. Create Academic Class
INSERT INTO academic_classes (id, name, level, capacity, "academicYearId")
SELECT 
  gen_random_uuid(), 'Grade 10-A', 10, 40, id
FROM academic_years WHERE name = '2024-2025'
ON CONFLICT DO NOTHING;

-- 9. Create Subject
INSERT INTO subjects (id, name, code, "academicClassId", "teacherId")
SELECT 
  gen_random_uuid(), 'Mathematics', 'MATH', ac.id, t.id
FROM academic_classes ac
CROSS JOIN LATERAL (SELECT id FROM teachers WHERE "tenantId" = (SELECT id FROM tenants WHERE slug = 'demo-school') LIMIT 1) t
WHERE ac.name = 'Grade 10-A'
ON CONFLICT DO NOTHING;

-- 10. Create Subscription
INSERT INTO subscriptions (id, plan, status, "tenantId")
SELECT 
  gen_random_uuid(), 'FREE', 'ACTIVE', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT ("tenantId") DO NOTHING;

SELECT 'Seed data created successfully!' as result;
