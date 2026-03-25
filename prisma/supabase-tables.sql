-- =====================================================
-- EDUNEXT SMS-LMS - ALL TABLES
-- Run this in Supabase SQL Editor (run all at once)
-- =====================================================

-- 1. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN DEFAULT false,
    "tenantId" TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", name)
);

-- 2. Terms
CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isCurrent" BOOLEAN DEFAULT false,
    "academicYearId" UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicYearId", name)
);

-- 3. Academic Classes
CREATE TABLE IF NOT EXISTS academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    capacity INTEGER DEFAULT 40,
    "academicYearId" UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicYearId", name)
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    "academicClassId" UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    "teacherId" TEXT REFERENCES teachers(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicClassId", code)
);

-- 5. Exams
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    "examType" TEXT DEFAULT 'MID_TERM' CHECK ("examType" IN ('QUIZ', 'MID_TERM', 'END_TERM', 'ASSIGNMENT', 'PRACTICE', 'WAEC', 'NECO', 'BECE', 'JAMB_UTME', 'MOCK')),
    status TEXT DEFAULT 'DRAFT',
    duration INTEGER DEFAULT 60,
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "termId" UUID REFERENCES terms(id),
    "subjectId" UUID REFERENCES subjects(id),
    "createdById" TEXT REFERENCES users(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'MULTIPLE_CHOICE',
    points INTEGER DEFAULT 1,
    "order" INTEGER,
    "examId" UUID REFERENCES exams(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Options
CREATE TABLE IF NOT EXISTS options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "isCorrect" BOOLEAN DEFAULT false,
    "order" INTEGER,
    "questionId" UUID REFERENCES questions(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Results
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score FLOAT,
    percentage FLOAT,
    status TEXT DEFAULT 'PENDING',
    "startedAt" TIMESTAMP WITH TIME ZONE,
    "submittedAt" TIMESTAMP WITH TIME ZONE,
    "gradedAt" TIMESTAMP WITH TIME ZONE,
    "examId" UUID REFERENCES exams(id) ON DELETE CASCADE,
    "studentId" TEXT REFERENCES students(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("examId", "studentId")
);

-- 9. Student Answers
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "resultId" UUID REFERENCES results(id) ON DELETE CASCADE,
    "questionId" UUID REFERENCES questions(id) ON DELETE CASCADE,
    "optionId" UUID REFERENCES options(id),
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    points FLOAT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("resultId", "questionId")
);

-- 10. Report Cards
CREATE TABLE IF NOT EXISTS report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "termId" UUID REFERENCES terms(id),
    "studentId" TEXT REFERENCES students(id),
    "totalScore" FLOAT,
    average FLOAT,
    grade TEXT,
    rank INTEGER,
    attendance FLOAT,
    remarks TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN DEFAULT false,
    "emailSentAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("termId", "studentId")
);

-- 11. Timetables (MUST come before timetable_slots)
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "academicYearId" UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    "isPublished" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("academicYearId", name)
);

-- 12. Timetable Slots
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timetableId" UUID REFERENCES timetables(id) ON DELETE CASCADE,
    "academicClassId" UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    "subjectId" UUID REFERENCES subjects(id),
    "teacherId" TEXT REFERENCES teachers(id),
    "dayOfWeek" INTEGER,
    period INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("timetableId", "academicClassId", "dayOfWeek", period)
);

-- 13. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan TEXT DEFAULT 'FREE',
    status TEXT DEFAULT 'ACTIVE',
    "tenantId" TEXT REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
    "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
    features JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Background Jobs
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    queue TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    "startedAt" TIMESTAMP WITH TIME ZONE,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "failedAt" TIMESTAMP WITH TIME ZONE,
    error TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Parents
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    occupation TEXT,
    "tenantId" TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    "studentId" TEXT REFERENCES students(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", "studentId")
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    description TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_academic_years_tenant ON academic_years("tenantId");
CREATE INDEX IF NOT EXISTS idx_terms_academic_year ON terms("academicYearId");
CREATE INDEX IF NOT EXISTS idx_academic_classes_academic_year ON academic_classes("academicYearId");
CREATE INDEX IF NOT EXISTS idx_subjects_academic_class ON subjects("academicClassId");
CREATE INDEX IF NOT EXISTS idx_exams_term ON exams("termId");
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams("subjectId");
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions("examId");
CREATE INDEX IF NOT EXISTS idx_options_question ON options("questionId");
CREATE INDEX IF NOT EXISTS idx_results_exam ON results("examId");
CREATE INDEX IF NOT EXISTS idx_results_student ON results("studentId");
CREATE INDEX IF NOT EXISTS idx_report_cards_term ON report_cards("termId");
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards("studentId");
CREATE INDEX IF NOT EXISTS idx_timetables_academic_year ON timetables("academicYearId");
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class ON timetable_slots("academicClassId");
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs("createdAt");

SELECT 'All tables created successfully!' as result;
