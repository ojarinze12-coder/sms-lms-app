const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function runMigration() {
  console.log('Starting tier system migration...');
  
  try {
    // 1. Create Curriculum enum
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            CREATE TYPE "Curriculum" AS ENUM ('NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✓ Created Curriculum enum');
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('⚠ Curriculum:', e.message.slice(0, 50));
    }

    // 2. Create Tiers table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tiers" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" VARCHAR(255) NOT NULL,
            "code" VARCHAR(10) NOT NULL,
            "alias" VARCHAR(255),
            "order" INTEGER NOT NULL,
            "isActive" BOOLEAN DEFAULT true,
            "tenantId" UUID NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT now(),
            "updatedAt" TIMESTAMPTZ DEFAULT now()
        );
        ALTER TABLE "tiers" ADD CONSTRAINT "tiers_tenantId_code_unique" UNIQUE ("tenantId", "code");
      `);
      console.log('✓ Created tiers table');
    } catch (e) {
      console.log('⚠ tiers:', e.message.slice(0, 50));
    }

    // 3. Create Departments table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "departments" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" VARCHAR(255) NOT NULL,
            "code" VARCHAR(10) NOT NULL,
            "alias" VARCHAR(255),
            "isActive" BOOLEAN DEFAULT true,
            "tierId" UUID NOT NULL,
            "tenantId" UUID NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT now(),
            "updatedAt" TIMESTAMPTZ DEFAULT now()
        );
        ALTER TABLE "departments" ADD CONSTRAINT "departments_tenantId_code_unique" UNIQUE ("tenantId", "code");
      `);
      console.log('✓ Created departments table');
    } catch (e) {
      console.log('⚠ departments:', e.message.slice(0, 50));
    }

    // 4. Create TierCurriculum table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tier_curriculum" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "tierId" UUID NOT NULL UNIQUE,
            "curriculum" "Curriculum" NOT NULL DEFAULT 'NERDC',
            "tenantId" UUID NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT now(),
            "updatedAt" TIMESTAMPTZ DEFAULT now()
        );
      `);
      console.log('✓ Created tier_curriculum table');
    } catch (e) {
      console.log('⚠ tier_curriculum:', e.message.slice(0, 50));
    }

    // 5. Create TenantSettings table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tenant_settings" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "tenantId" UUID NOT NULL UNIQUE,
            "curriculumType" "Curriculum" DEFAULT 'NERDC',
            "usePerTierCurriculum" BOOLEAN DEFAULT false,
            "tiersSetupComplete" BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMPTZ DEFAULT now(),
            "updatedAt" TIMESTAMPTZ DEFAULT now()
        );
      `);
      console.log('✓ Created tenant_settings table');
    } catch (e) {
      console.log('⚠ tenant_settings:', e.message.slice(0, 50));
    }

    // 6. Add columns to academic_classes
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "tierId" UUID;
        ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "departmentId" UUID;
      `);
      console.log('✓ Added columns to academic_classes');
    } catch (e) {
      console.log('⚠ academic_classes columns:', e.message.slice(0, 50));
    }

    // 7. Add columns to subjects
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "departmentId" UUID;
        ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "curriculum" "Curriculum" DEFAULT 'NERDC';
      `);
      console.log('✓ Added columns to subjects');
    } catch (e) {
      console.log('⚠ subjects columns:', e.message.slice(0, 50));
    }

    // 8. Add TIER_SETUP to OnboardingTaskKey
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TYPE "OnboardingTaskKey" ADD VALUE 'TIER_SETUP';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✓ Added TIER_SETUP to OnboardingTaskKey');
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('⚠ OnboardingTaskKey:', e.message.slice(0, 50));
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
