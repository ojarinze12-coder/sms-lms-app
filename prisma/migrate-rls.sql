-- =====================================================
-- RLS Migration for SMS-LMS Database
-- Enables Row Level Security on all tables
-- Date: April 15, 2026
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- STEP 1: Create Helper Functions
-- =====================================================

-- Function to set tenant context (used by Prisma middleware)
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$;

-- Function to check if user is super admin (service role bypass)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if using service role key (can be customized based on your setup)
  RETURN current_setting('app.service_role', true) = 'true';
END;
$$;

-- =====================================================
-- STEP 2: Enable RLS on Tenant/School Tables
-- =====================================================

-- tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (true);
DROP POLICY IF EXISTS "tenants_insert" ON tenants;
CREATE POLICY "tenants_insert" ON tenants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "tenants_update" ON tenants;
CREATE POLICY "tenants_update" ON tenants FOR UPDATE USING (true);
DROP POLICY IF EXISTS "tenants_delete" ON tenants;
CREATE POLICY "tenants_delete" ON tenants FOR DELETE USING (true);

-- branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branches_tenant_isolation" ON branches;
CREATE POLICY "branches_tenant_isolation" ON branches FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tenant_settings table
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_settings_tenant_isolation" ON tenant_settings;
CREATE POLICY "tenant_settings_tenant_isolation" ON tenant_settings FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tenant_config table
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_config_tenant_isolation" ON tenant_config;
CREATE POLICY "tenant_config_tenant_isolation" ON tenant_config FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tenant_modules table
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_modules_tenant_isolation" ON tenant_modules;
CREATE POLICY "tenant_modules_tenant_isolation" ON tenant_modules FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tenant_resources table
ALTER TABLE tenant_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_resources_tenant_isolation" ON tenant_resources;
CREATE POLICY "tenant_resources_tenant_isolation" ON tenant_resources FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tenant_health table
ALTER TABLE tenant_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_health_tenant_isolation" ON tenant_health;
CREATE POLICY "tenant_health_tenant_isolation" ON tenant_health FOR ALL USING ("tenantId" = get_current_tenant_id());

-- onboarding_tasks table
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_tasks_tenant_isolation" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks_tenant_isolation" ON onboarding_tasks FOR ALL USING ("tenantId" = get_current_tenant_id());

-- subscription_plans table
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_plans_tenant_isolation" ON subscription_plans;
CREATE POLICY "subscription_plans_tenant_isolation" ON subscription_plans FOR ALL USING ("tenantId" = get_current_tenant_id());

-- plan_features table
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plan_features_tenant_isolation" ON plan_features;
CREATE POLICY "plan_features_tenant_isolation" ON plan_features FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 3: Enable RLS on User Tables
-- =====================================================

-- users table (uses user_id for isolation)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
CREATE POLICY "users_tenant_isolation" ON users FOR ALL USING (
  "tenantId" = get_current_tenant_id() OR is_service_role() = true
);

-- students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_tenant_isolation" ON students;
CREATE POLICY "students_tenant_isolation" ON students FOR ALL USING ("tenantId" = get_current_tenant_id());

-- teachers table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_tenant_isolation" ON teachers;
CREATE POLICY "teachers_tenant_isolation" ON teachers FOR ALL USING ("tenantId" = get_current_tenant_id());

-- staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_tenant_isolation" ON staff;
CREATE POLICY "staff_tenant_isolation" ON staff FOR ALL USING ("tenantId" = get_current_tenant_id());

-- parents table
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_tenant_isolation" ON parents;
CREATE POLICY "parents_tenant_isolation" ON parents FOR ALL USING ("tenantId" = get_current_tenant_id());

-- parent_students table
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_students_tenant_isolation" ON parent_students;
CREATE POLICY "parent_students_tenant_isolation" ON parent_students FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- sibling_discounts table
ALTER TABLE sibling_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sibling_discounts_tenant_isolation" ON sibling_discounts;
CREATE POLICY "sibling_discounts_tenant_isolation" ON sibling_discounts FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 4: Enable RLS on Academic Tables
-- =====================================================

-- academic_years table
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_years_tenant_isolation" ON academic_years;
CREATE POLICY "academic_years_tenant_isolation" ON academic_years FOR ALL USING ("tenantId" = get_current_tenant_id());

-- terms table
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "terms_tenant_isolation" ON terms;
CREATE POLICY "terms_tenant_isolation" ON terms FOR ALL USING (
  academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id())
);

-- tiers table
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tiers_tenant_isolation" ON tiers;
CREATE POLICY "tiers_tenant_isolation" ON tiers FOR ALL USING ("tenantId" = get_current_tenant_id());

-- departments table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_tenant_isolation" ON departments;
CREATE POLICY "departments_tenant_isolation" ON departments FOR ALL USING ("tenantId" = get_current_tenant_id());

-- tier_curriculum table
ALTER TABLE tier_curriculum ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tier_curriculum_tenant_isolation" ON tier_curriculum;
CREATE POLICY "tier_curriculum_tenant_isolation" ON tier_curriculum FOR ALL USING ("tenantId" = get_current_tenant_id());

-- academic_classes table
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_classes_tenant_isolation" ON academic_classes;
CREATE POLICY "academic_classes_tenant_isolation" ON academic_classes FOR ALL USING (
  academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id())
);

-- subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_tenant_isolation" ON subjects;
CREATE POLICY "subjects_tenant_isolation" ON subjects FOR ALL USING (
  "academicClassId" IN (SELECT id FROM academic_classes WHERE academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id()))
);

-- courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_tenant_isolation" ON courses;
CREATE POLICY "courses_tenant_isolation" ON courses FOR ALL USING ("tenantId" = get_current_tenant_id());

-- lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_tenant_isolation" ON lessons;
CREATE POLICY "lessons_tenant_isolation" ON lessons FOR ALL USING (
  "courseId" IN (SELECT id FROM courses WHERE "tenantId" = get_current_tenant_id())
);

-- lesson_progress table
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lesson_progress_tenant_isolation" ON lesson_progress;
CREATE POLICY "lesson_progress_tenant_isolation" ON lesson_progress FOR ALL USING (
  "lessonId" IN (SELECT id FROM lessons WHERE "courseId" IN (SELECT id FROM courses WHERE "tenantId" = get_current_tenant_id()))
);

-- assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignments_tenant_isolation" ON assignments;
CREATE POLICY "assignments_tenant_isolation" ON assignments FOR ALL USING (
  "courseId" IN (SELECT id FROM courses WHERE "tenantId" = get_current_tenant_id())
);

-- assignment_submissions table
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignment_submissions_tenant_isolation" ON assignment_submissions;
CREATE POLICY "assignment_submissions_tenant_isolation" ON assignment_submissions FOR ALL USING (
  "assignmentId" IN (SELECT id FROM assignments WHERE "courseId" IN (SELECT id FROM courses WHERE "tenantId" = get_current_tenant_id()))
);

-- classes table (LMS classes)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classes_tenant_isolation" ON classes;
CREATE POLICY "classes_tenant_isolation" ON classes FOR ALL USING ("tenantId" = get_current_tenant_id());

-- enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enrollments_tenant_isolation" ON enrollments;
CREATE POLICY "enrollments_tenant_isolation" ON enrollments FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- exams table
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exams_tenant_isolation" ON exams;
CREATE POLICY "exams_tenant_isolation" ON exams FOR ALL USING (
  "subjectId" IN (SELECT id FROM subjects WHERE "academicClassId" IN (SELECT id FROM academic_classes WHERE academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id())))
);

-- questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_tenant_isolation" ON questions;
CREATE POLICY "questions_tenant_isolation" ON questions FOR ALL USING (
  "examId" IN (SELECT id FROM exams WHERE "subjectId" IN (SELECT id FROM subjects WHERE "academicClassId" IN (SELECT id FROM academic_classes WHERE academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id()))))
);

-- options table
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "options_tenant_isolation" ON options;
CREATE POLICY "options_tenant_isolation" ON options FOR ALL USING (
  "questionId" IN (SELECT id FROM questions WHERE "examId" IN (SELECT id FROM exams WHERE "subjectId" IN (SELECT id FROM subjects WHERE "academicClassId" IN (SELECT id FROM academic_classes WHERE academicYearId IN (SELECT id FROM academic_years WHERE "tenantId" = get_current_tenant_id())))))
);

-- results table
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "results_tenant_isolation" ON results;
CREATE POLICY "results_tenant_isolation" ON results FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- student_answers table
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_answers_tenant_isolation" ON student_answers;
CREATE POLICY "student_answers_tenant_isolation" ON student_answers FOR ALL USING (
  "resultId" IN (SELECT id FROM results WHERE "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id()))
);

-- grading_scales table
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grading_scales_tenant_isolation" ON grading_scales;
CREATE POLICY "grading_scales_tenant_isolation" ON grading_scales FOR ALL USING ("tenantId" = get_current_tenant_id());

-- report_cards table
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "report_cards_tenant_isolation" ON report_cards;
CREATE POLICY "report_cards_tenant_isolation" ON report_cards FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "applications_tenant_isolation" ON applications;
CREATE POLICY "applications_tenant_isolation" ON applications FOR ALL USING ("tenantId" = get_current_tenant_id());

-- timetables table
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetables_tenant_isolation" ON timetables;
CREATE POLICY "timetables_tenant_isolation" ON timetables FOR ALL USING ("tenantId" = get_current_tenant_id());

-- timetable_slots table
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetable_slots_tenant_isolation" ON timetable_slots;
CREATE POLICY "timetable_slots_tenant_isolation" ON timetable_slots FOR ALL USING (
  "timetableId" IN (SELECT id FROM timetables WHERE "tenantId" = get_current_tenant_id())
);

-- academic_records table
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_records_tenant_isolation" ON academic_records;
CREATE POLICY "academic_records_tenant_isolation" ON academic_records FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 5: Enable RLS on Finance Tables
-- =====================================================

-- invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON invoices;
CREATE POLICY "invoices_tenant_isolation" ON invoices FOR ALL USING ("tenantId" = get_current_tenant_id());

-- subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_tenant_isolation" ON subscriptions;
CREATE POLICY "subscriptions_tenant_isolation" ON subscriptions FOR ALL USING ("tenantId" = get_current_tenant_id());

-- subscription_invoices table
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_invoices_tenant_isolation" ON subscription_invoices;
CREATE POLICY "subscription_invoices_tenant_isolation" ON subscription_invoices FOR ALL USING (
  "subscriptionId" IN (SELECT id FROM subscriptions WHERE "tenantId" = get_current_tenant_id())
);

-- subscription_payments table
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_payments_tenant_isolation" ON subscription_payments;
CREATE POLICY "subscription_payments_tenant_isolation" ON subscription_payments FOR ALL USING (
  "subscriptionId" IN (SELECT id FROM subscriptions WHERE "tenantId" = get_current_tenant_id())
);

-- fee_structures table
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fee_structures_tenant_isolation" ON fee_structures;
CREATE POLICY "fee_structures_tenant_isolation" ON fee_structures FOR ALL USING ("tenantId" = get_current_tenant_id());

-- fee_payments table
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fee_payments_tenant_isolation" ON fee_payments;
CREATE POLICY "fee_payments_tenant_isolation" ON fee_payments FOR ALL USING ("tenantId" = get_current_tenant_id());

-- payroll table
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payroll_tenant_isolation" ON payroll;
CREATE POLICY "payroll_tenant_isolation" ON payroll FOR ALL USING ("tenantId" = get_current_tenant_id());

-- audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON audit_logs;
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 6: Enable RLS on Communication Tables
-- =====================================================

-- announcements table
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_tenant_isolation" ON announcements;
CREATE POLICY "announcements_tenant_isolation" ON announcements FOR ALL USING ("tenantId" = get_current_tenant_id());

-- message_campaigns table
ALTER TABLE message_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "message_campaigns_tenant_isolation" ON message_campaigns;
CREATE POLICY "message_campaigns_tenant_isolation" ON message_campaigns FOR ALL USING ("tenantId" = get_current_tenant_id());

-- pta_notices table
ALTER TABLE pta_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pta_notices_tenant_isolation" ON pta_notices;
CREATE POLICY "pta_notices_tenant_isolation" ON pta_notices FOR ALL USING ("tenantId" = get_current_tenant_id());

-- conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_tenant_isolation" ON conversations;
CREATE POLICY "conversations_tenant_isolation" ON conversations FOR ALL USING ("tenantId" = get_current_tenant_id());

-- conversation_participants table
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversation_participants_tenant_isolation" ON conversation_participants;
CREATE POLICY "conversation_participants_tenant_isolation" ON conversation_participants FOR ALL USING (
  "conversationId" IN (SELECT id FROM conversations WHERE "tenantId" = get_current_tenant_id())
);

-- messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_tenant_isolation" ON messages;
CREATE POLICY "messages_tenant_isolation" ON messages FOR ALL USING (
  "conversationId" IN (SELECT id FROM conversations WHERE "tenantId" = get_current_tenant_id())
);

-- broadcasts table
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcasts_tenant_isolation" ON broadcasts;
CREATE POLICY "broadcasts_tenant_isolation" ON broadcasts FOR ALL USING ("tenantId" = get_current_tenant_id());

-- support_tickets table
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_tickets_tenant_isolation" ON support_tickets;
CREATE POLICY "support_tickets_tenant_isolation" ON support_tickets FOR ALL USING (
  "tenantId" = get_current_tenant_id() OR is_service_role() = true
);

-- ticket_messages table
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_messages_tenant_isolation" ON ticket_messages;
CREATE POLICY "ticket_messages_tenant_isolation" ON ticket_messages FOR ALL USING (
  "ticketId" IN (SELECT id FROM support_tickets WHERE "tenantId" = get_current_tenant_id() OR is_service_role() = true)
);

-- =====================================================
-- STEP 7: Enable RLS on Library Tables
-- =====================================================

-- library_books table
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_books_tenant_isolation" ON library_books;
CREATE POLICY "library_books_tenant_isolation" ON library_books FOR ALL USING ("tenantId" = get_current_tenant_id());

-- library_circulations table
ALTER TABLE library_circulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_circulations_tenant_isolation" ON library_circulations;
CREATE POLICY "library_circulations_tenant_isolation" ON library_circulations FOR ALL USING (
  "bookId" IN (SELECT id FROM library_books WHERE "tenantId" = get_current_tenant_id())
);

-- =====================================================
-- STEP 8: Enable RLS on Hostel Tables
-- =====================================================

-- hostels table
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostels_tenant_isolation" ON hostels;
CREATE POLICY "hostels_tenant_isolation" ON hostels FOR ALL USING ("tenantId" = get_current_tenant_id());

-- hostel_rooms table
ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostel_rooms_tenant_isolation" ON hostel_rooms;
CREATE POLICY "hostel_rooms_tenant_isolation" ON hostel_rooms FOR ALL USING (
  "hostelId" IN (SELECT id FROM hostels WHERE "tenantId" = get_current_tenant_id())
);

-- hostel_beds table
ALTER TABLE hostel_beds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostel_beds_tenant_isolation" ON hostel_beds;
CREATE POLICY "hostel_beds_tenant_isolation" ON hostel_beds FOR ALL USING (
  "roomId" IN (SELECT id FROM hostel_rooms WHERE "hostelId" IN (SELECT id FROM hostels WHERE "tenantId" = get_current_tenant_id()))
);

-- hostel_allocations table
ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hostel_allocations_tenant_isolation" ON hostel_allocations;
CREATE POLICY "hostel_allocations_tenant_isolation" ON hostel_allocations FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 9: Enable RLS on Transport Tables
-- =====================================================

-- transport_routes table
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transport_routes_tenant_isolation" ON transport_routes;
CREATE POLICY "transport_routes_tenant_isolation" ON transport_routes FOR ALL USING ("tenantId" = get_current_tenant_id());

-- transport_stops table
ALTER TABLE transport_stops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transport_stops_tenant_isolation" ON transport_stops;
CREATE POLICY "transport_stops_tenant_isolation" ON transport_stops FOR ALL USING (
  "routeId" IN (SELECT id FROM transport_routes WHERE "tenantId" = get_current_tenant_id())
);

-- transport_vehicles table
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transport_vehicles_tenant_isolation" ON transport_vehicles;
CREATE POLICY "transport_vehicles_tenant_isolation" ON transport_vehicles FOR ALL USING ("tenantId" = get_current_tenant_id());

-- transport_subscriptions table
ALTER TABLE transport_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transport_subscriptions_tenant_isolation" ON transport_subscriptions;
CREATE POLICY "transport_subscriptions_tenant_isolation" ON transport_subscriptions FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 10: Enable RLS on Other Tables
-- =====================================================

-- staff_leaves table
ALTER TABLE staff_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_leaves_tenant_isolation" ON staff_leaves;
CREATE POLICY "staff_leaves_tenant_isolation" ON staff_leaves FOR ALL USING ("tenantId" = get_current_tenant_id());

-- nigerian_locations table
ALTER TABLE nigerian_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nigerian_locations_select" ON nigerian_locations;
CREATE POLICY "nigerian_locations_select" ON nigerian_locations FOR SELECT USING (true);

-- badges table
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_tenant_isolation" ON badges;
CREATE POLICY "badges_tenant_isolation" ON badges FOR ALL USING ("tenantId" = get_current_tenant_id());

-- student_badges table
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_badges_tenant_isolation" ON student_badges;
CREATE POLICY "student_badges_tenant_isolation" ON student_badges FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- certificates table
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificates_tenant_isolation" ON certificates;
CREATE POLICY "certificates_tenant_isolation" ON certificates FOR ALL USING ("tenantId" = get_current_tenant_id());

-- student_certificates table
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_certificates_tenant_isolation" ON student_certificates;
CREATE POLICY "student_certificates_tenant_isolation" ON student_certificates FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- certificate_templates table
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificate_templates_tenant_isolation" ON certificate_templates;
CREATE POLICY "certificate_templates_tenant_isolation" ON certificate_templates FOR ALL USING ("tenantId" = get_current_tenant_id());

-- certificate_issuances table
ALTER TABLE certificate_issuances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificate_issuances_tenant_isolation" ON certificate_issuances;
CREATE POLICY "certificate_issuances_tenant_isolation" ON certificate_issuances FOR ALL USING ("tenantId" = get_current_tenant_id());

-- student_medical_records table
ALTER TABLE student_medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_medical_records_tenant_isolation" ON student_medical_records;
CREATE POLICY "student_medical_records_tenant_isolation" ON student_medical_records FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- student_vaccinations table
ALTER TABLE student_vaccinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_vaccinations_tenant_isolation" ON student_vaccinations;
CREATE POLICY "student_vaccinations_tenant_isolation" ON student_vaccinations FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- student_chronic_conditions table
ALTER TABLE student_chronic_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_chronic_conditions_tenant_isolation" ON student_chronic_conditions;
CREATE POLICY "student_chronic_conditions_tenant_isolation" ON student_chronic_conditions FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- behavior_incidents table
ALTER TABLE behavior_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "behavior_incidents_tenant_isolation" ON behavior_incidents;
CREATE POLICY "behavior_incidents_tenant_isolation" ON behavior_incidents FOR ALL USING ("tenantId" = get_current_tenant_id());

-- behavior_logs table
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "behavior_logs_tenant_isolation" ON behavior_logs;
CREATE POLICY "behavior_logs_tenant_isolation" ON behavior_logs FOR ALL USING (
  "studentId" IN (SELECT id FROM students WHERE "tenantId" = get_current_tenant_id())
);

-- transcripts table
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transcripts_tenant_isolation" ON transcripts;
CREATE POLICY "transcripts_tenant_isolation" ON transcripts FOR ALL USING ("tenantId" = get_current_tenant_id());

-- discussion_forums table
ALTER TABLE discussion_forums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_forums_tenant_isolation" ON discussion_forums;
CREATE POLICY "discussion_forums_tenant_isolation" ON discussion_forums FOR ALL USING ("tenantId" = get_current_tenant_id());

-- discussion_posts table
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_posts_tenant_isolation" ON discussion_posts;
CREATE POLICY "discussion_posts_tenant_isolation" ON discussion_posts FOR ALL USING (
  "forumId" IN (SELECT id FROM discussion_forums WHERE "tenantId" = get_current_tenant_id())
);

-- virtual_classes table
ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "virtual_classes_tenant_isolation" ON virtual_classes;
CREATE POLICY "virtual_classes_tenant_isolation" ON virtual_classes FOR ALL USING ("tenantId" = get_current_tenant_id());

-- report_templates table
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "report_templates_tenant_isolation" ON report_templates;
CREATE POLICY "report_templates_tenant_isolation" ON report_templates FOR ALL USING ("tenantId" = get_current_tenant_id());

-- report_generations table
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "report_generations_tenant_isolation" ON report_generations;
CREATE POLICY "report_generations_tenant_isolation" ON report_generations FOR ALL USING ("tenantId" = get_current_tenant_id());

-- documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_tenant_isolation" ON documents;
CREATE POLICY "documents_tenant_isolation" ON documents FOR ALL USING ("tenantId" = get_current_tenant_id());

-- document_categories table
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_categories_tenant_isolation" ON document_categories;
CREATE POLICY "document_categories_tenant_isolation" ON document_categories FOR ALL USING ("tenantId" = get_current_tenant_id());

-- platform_settings table
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_settings_select" ON platform_settings;
CREATE POLICY "platform_settings_select" ON platform_settings FOR SELECT USING (true);

-- platform_audit_logs table
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_audit_logs_select" ON platform_audit_logs;
CREATE POLICY "platform_audit_logs_select" ON platform_audit_logs FOR SELECT USING (true);

-- global_policies table
ALTER TABLE global_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "global_policies_select" ON global_policies;
CREATE POLICY "global_policies_select" ON global_policies FOR SELECT USING (true);

-- system_statuses table
ALTER TABLE system_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_statuses_select" ON system_statuses;
CREATE POLICY "system_statuses_select" ON system_statuses FOR SELECT USING (true);

-- feature_usage table
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_usage_tenant_isolation" ON feature_usage;
CREATE POLICY "feature_usage_tenant_isolation" ON feature_usage FOR ALL USING ("tenantId" = get_current_tenant_id());

-- resource_logs table
ALTER TABLE resource_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resource_logs_tenant_isolation" ON resource_logs;
CREATE POLICY "resource_logs_tenant_isolation" ON resource_logs FOR ALL USING ("tenantId" = get_current_tenant_id());

-- background_jobs table
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "background_jobs_tenant_isolation" ON background_jobs;
CREATE POLICY "background_jobs_tenant_isolation" ON background_jobs FOR ALL USING ("tenantId" = get_current_tenant_id());

-- =====================================================
-- STEP 11: Commit
-- =====================================================

COMMIT;

-- =====================================================
-- Verification Query (run after migration)
-- =====================================================
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND rowsecurity = true 
-- ORDER BY tablename;