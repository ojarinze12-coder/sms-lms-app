-- Create Medical Records table
CREATE TABLE IF NOT EXISTS "student_medical_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "visitDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "visitType" TEXT NOT NULL DEFAULT 'CHECKUP',
  "diagnosis" TEXT,
  "symptoms" TEXT,
  "treatment" TEXT,
  "prescribedMed" TEXT,
  "doctorName" TEXT,
  "doctorContact" TEXT,
  "nextVisitDate" TIMESTAMPTZ,
  "attachments" TEXT[] DEFAULT '{}',
  "notes" TEXT,
  "isConfidential" BOOLEAN DEFAULT false,
  "createdById" UUID,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_medical_records_student" ON "student_medical_records" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_medical_records_tenant" ON "student_medical_records" ("tenantId");

-- Create Vaccinations table
CREATE TABLE IF NOT EXISTS "student_vaccinations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "vaccineName" TEXT NOT NULL,
  "vaccineType" TEXT,
  "dateGiven" TIMESTAMPTZ NOT NULL,
  "nextDueDate" TIMESTAMPTZ,
  "batchNo" TEXT,
  "lotNo" TEXT,
  "site" TEXT,
  "administeredBy" TEXT,
  "adminTitle" TEXT,
  "facility" TEXT,
  "reactions" TEXT,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "notes" TEXT,
  "createdById" UUID,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_vaccinations_student" ON "student_vaccinations" ("studentId");

-- Create Chronic Conditions table
CREATE TABLE IF NOT EXISTS "student_chronic_conditions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "condition" TEXT NOT NULL,
  "diagnosedDate" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "severity" TEXT,
  "treatment" TEXT,
  "medication" TEXT,
  "emergencyPlan" TEXT,
  "lastCheckup" TIMESTAMPTZ,
  "nextCheckup" TIMESTAMPTZ,
  "notes" TEXT,
  "createdById" UUID,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_chronic_conditions_student" ON "student_chronic_conditions" ("studentId");

-- Create Behavior Incidents table
CREATE TABLE IF NOT EXISTS "behavior_incidents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "incidentType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'LOW',
  "location" TEXT,
  "description" TEXT NOT NULL,
  "witnesses" TEXT,
  "actionTaken" TEXT,
  "actionType" TEXT,
  "parentNotified" BOOLEAN DEFAULT false,
  "parentContact" TEXT,
  "followUpDate" TIMESTAMPTZ,
  "followUpNotes" TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reportedById" UUID,
  "createdById" UUID,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_behavior_incidents_student" ON "behavior_incidents" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_behavior_incidents_tenant" ON "behavior_incidents" ("tenantId");

-- Create Behavior Logs table
CREATE TABLE IF NOT EXISTS "behavior_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "behaviorType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "remarks" TEXT,
  "teacherId" UUID,
  "classId" UUID,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_behavior_log_student" ON "behavior_logs" ("studentId");

-- Create Academic Records table
CREATE TABLE IF NOT EXISTS "academic_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "termId" UUID,
  "classId" UUID NOT NULL,
  "subjectId" UUID,
  "ca1Score" FLOAT,
  "ca2Score" FLOAT,
  "examScore" FLOAT,
  "totalScore" FLOAT,
  "grade" TEXT,
  "gradePoint" FLOAT,
  "remarks" TEXT,
  "position" INTEGER,
  "attendance" FLOAT,
  "daysPresent" INTEGER,
  "daysAbsent" INTEGER,
  "teacherId" UUID,
  "approvedById" UUID,
  "approvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "academic_records_unique" ON "academic_records" ("studentId", "academicYearId", "termId", "subjectId");
CREATE INDEX IF NOT EXISTS "idx_academic_records_student" ON "academic_records" ("studentId");

-- Create Transcripts table
CREATE TABLE IF NOT EXISTS "transcripts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "classId" UUID,
  "pdfUrl" TEXT,
  "documentNo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sentAt" TIMESTAMPTZ,
  "deliveredAt" TIMESTAMPTZ,
  "purpose" TEXT,
  "sendingTo" TEXT,
  "sentById" UUID,
  "notes" TEXT,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_transcripts_student" ON "transcripts" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_transcripts_tenant" ON "transcripts" ("tenantId");

-- Create Certificate Templates table
CREATE TABLE IF NOT EXISTS "certificate_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'COMPLETION',
  "templateData" JSONB,
  "layout" TEXT DEFAULT 'A4_PORTRAIT',
  "isActive" BOOLEAN DEFAULT true,
  "autoIssue" BOOLEAN DEFAULT false,
  "criteria" JSONB,
  "schoolName" TEXT,
  "schoolLogo" TEXT,
  "sealImage" TEXT,
  "signatureImage" TEXT,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_certificate_templates_tenant" ON "certificate_templates" ("tenantId");

-- Create Certificate Issuances table
CREATE TABLE IF NOT EXISTS "certificate_issuances" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "templateId" UUID NOT NULL,
  "academicYearId" UUID,
  "certificateNo" TEXT UNIQUE NOT NULL,
  "pdfUrl" TEXT,
  "qrCode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'GENERATED',
  "issuedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sentAt" TIMESTAMPTZ,
  "viewedAt" TIMESTAMPTZ,
  "recipientEmail" TEXT,
  "recipientName" TEXT,
  "issuedById" UUID,
  "notes" TEXT,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_certificate_issuances_student" ON "certificate_issuances" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_certificate_issuances_tenant" ON "certificate_issuances" ("tenantId");