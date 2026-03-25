-- Run this in Supabase SQL Editor to create teacher and student user accounts

-- First, make sure demo-school tenant exists (adjust if you already have one)
INSERT INTO tenants (id, name, slug, plan, "brandColor")
VALUES (gen_random_uuid(), 'Demo School', 'demo-school', 'FREE', '#059669')
ON CONFLICT (slug) DO NOTHING;

-- Create Teacher User (password: teacher123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "tenantId")
SELECT gen_random_uuid(), 'teacher@demo-school.com', 
       '$2a$10$7lvkH4UQfR9Ir3X8v.QPxec02QDXqOVO3BMxAaqWKOMiNu13CacBW', 
       'John', 'Smith', 'TEACHER', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  role = 'TEACHER';

-- Create Student User (password: student123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "tenantId")
SELECT gen_random_uuid(), 'student@demo-school.com', 
       '$2a$10$OBYvHQoHwV1Yue4khqWYZeWwGir/hWFeJY4js2Us/pANsORZ5N61i', 
       'Jane', 'Doe', 'STUDENT', id
FROM tenants WHERE slug = 'demo-school'
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  role = 'STUDENT';

-- Verify users created
SELECT email, role FROM users WHERE email IN ('teacher@demo-school.com', 'student@demo-school.com');
