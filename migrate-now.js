const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function createTable(sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    return true;
  } catch (error) {
    console.log('  Error:', error.message.slice(0, 100));
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting tier system migration...\n');
  
  // Create Curriculum enum
  console.log('1. Creating Curriculum enum...');
  await createTable(`
    DO $$ BEGIN
        CREATE TYPE "Curriculum" AS ENUM ('NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log('   ✓ Done\n');

  // Create Tiers table
  console.log('2. Creating tiers table...');
  const tiersCreated = await createTable(`
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
  `);
  if (tiersCreated) {
    await createTable(`CREATE UNIQUE INDEX IF NOT EXISTS "tiers_tenantId_code_unique" ON "tiers"("tenantId", "code");`);
    await createTable(`CREATE INDEX IF NOT EXISTS "idx_tiers_tenant" ON "tiers"("tenantId");`);
    console.log('   ✓ Created tiers table with indexes\n');
  }

  // Create Departments table
  console.log('3. Creating departments table...');
  const deptsCreated = await createTable(`
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
  `);
  if (deptsCreated) {
    await createTable(`CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenantId_code_unique" ON "departments"("tenantId", "code");`);
    await createTable(`CREATE INDEX IF NOT EXISTS "idx_departments_tenant" ON "departments"("tenantId");`);
    await createTable(`CREATE INDEX IF NOT EXISTS "idx_departments_tier" ON "departments"("tierId");`);
    console.log('   ✓ Created departments table with indexes\n');
  }

  // Create TierCurriculum table
  console.log('4. Creating tier_curriculum table...');
  const tcCreated = await createTable(`
    CREATE TABLE IF NOT EXISTS "tier_curriculum" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tierId" UUID NOT NULL UNIQUE,
        "curriculum" "Curriculum" NOT NULL DEFAULT 'NERDC',
        "tenantId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
  `);
  if (tcCreated) {
    await createTable(`CREATE INDEX IF NOT EXISTS "idx_tier_curriculum_tenant" ON "tier_curriculum"("tenantId");`);
    console.log('   ✓ Created tier_curriculum table with indexes\n');
  }

  // Create TenantSettings table
  console.log('5. Creating tenant_settings table...');
  const tsCreated = await createTable(`
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
  if (tsCreated) {
    console.log('   ✓ Created tenant_settings table\n');
  }

  // Add columns to academic_classes
  console.log('6. Adding columns to academic_classes...');
  await createTable(`ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "tierId" UUID;`);
  await createTable(`ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "departmentId" UUID;`);
  await createTable(`CREATE INDEX IF NOT EXISTS "idx_academic_classes_tier" ON "academic_classes"("tierId");`);
  console.log('   ✓ Added tierId, departmentId columns\n');

  // Add columns to subjects
  console.log('7. Adding columns to subjects...');
  await createTable(`ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "departmentId" UUID;`);
  await createTable(`ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "curriculum" "Curriculum" DEFAULT 'NERDC';`);
  await createTable(`CREATE INDEX IF NOT EXISTS "idx_subjects_department" ON "subjects"("departmentId");`);
  console.log('   ✓ Added departmentId, curriculum columns\n');

  // Add TIER_SETUP to OnboardingTaskKey
  console.log('8. Updating OnboardingTaskKey enum...');
  await createTable(`
    DO $$ BEGIN
        ALTER TYPE "OnboardingTaskKey" ADD VALUE 'TIER_SETUP';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log('   ✓ Added TIER_SETUP value\n');

  // Verify tables exist
  console.log('9. Verifying tables...');
  const result = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('tiers', 'departments', 'tier_curriculum', 'tenant_settings')
    ORDER BY table_name;
  `);
  
  console.log('   Found tables:', result.map(r => r.table_name).join(', ') || 'none');
  
  console.log('\n✅ Migration completed!');
  console.log('\nNext steps:');
  console.log('1. Run seed: npm run db:seed');
  console.log('2. Access tiers: /sms/tiers');
  console.log('3. Access departments: /sms/departments');
  
  await prisma.$disconnect();
}

runMigration().catch(console.error);
