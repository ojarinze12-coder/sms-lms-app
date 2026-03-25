const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function runMigration() {
  console.log('🚀 Starting badge system migration...\n');

  // 1. Add columns to TenantSettings
  console.log('1. Adding badge settings to tenant_settings...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "tenant_settings" 
      ADD COLUMN IF NOT EXISTS "badgesEnabled" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "badgesAutoAward" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "badgesShowOnReport" BOOLEAN DEFAULT true;
    `);
    console.log('   ✓ Added badge columns to tenant_settings\n');
  } catch (e) {
    console.log('   ⚠ tenant_settings:', e.message.slice(0, 80));
  }

  // 2. Add columns to Badge
  console.log('2. Adding tier columns to badges...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "badges" 
      ADD COLUMN IF NOT EXISTS "isGlobal" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "tierId" UUID,
      ADD COLUMN IF NOT EXISTS "tenantId" UUID;
    `);
    console.log('   ✓ Added columns to badges\n');
  } catch (e) {
    console.log('   ⚠ badges columns:', e.message.slice(0, 80));
  }

  // 3. Add columns to StudentBadge
  console.log('3. Adding tracking columns to student_badges...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "student_badges" 
      ADD COLUMN IF NOT EXISTS "tierLevel" INTEGER,
      ADD COLUMN IF NOT EXISTS "tierName" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "awardedBy" UUID,
      ADD COLUMN IF NOT EXISTS "isAuto" BOOLEAN DEFAULT true;
    `);
    console.log('   ✓ Added columns to student_badges\n');
  } catch (e) {
    console.log('   ⚠ student_badges columns:', e.message.slice(0, 80));
  }

  // 4. Add indexes
  console.log('4. Adding indexes...');
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_badges_tenant" ON "badges"("tenantId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_badges_tier" ON "badges"("tierId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_student_badges_student" ON "student_badges"("studentId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_student_badges_badge" ON "student_badges"("badgeId");`);
    console.log('   ✓ Created indexes\n');
  } catch (e) {
    console.log('   ⚠ indexes:', e.message.slice(0, 80));
  }

  // 5. Create default badges for demo school
  console.log('5. Creating default badges...');
  const demoTenant = await prisma.tenant.findUnique({ where: { slug: 'demo-school' } });
  
  if (demoTenant) {
    const defaultBadges = [
      // Global badges (all tiers)
      { name: 'First Steps', description: 'Joined the school', icon: '🎓', isGlobal: true, points: 10 },
      { name: 'Profile Complete', description: 'Completed profile information', icon: '✅', isGlobal: true, points: 5 },
      { name: 'First Exam', description: 'Completed first exam', icon: '📝', isGlobal: true, points: 15 },
      { name: 'Perfect Attendance', description: '100% attendance for a term', icon: '🏆', isGlobal: true, points: 25 },
      { name: 'Star Student', description: 'Top performer in class', icon: '⭐', isGlobal: true, points: 50 },
      
      // Tier-specific badges
      { name: 'Primary Star', description: 'Excelled in Primary school', icon: '🌟', isGlobal: false, tierCode: 'PRI', points: 30 },
      { name: 'JSS Achiever', description: 'Outstanding in Junior Secondary', icon: '💪', isGlobal: false, tierCode: 'JSS', points: 35 },
      { name: 'SSS Excellence', description: 'Excellence in Senior Secondary', icon: '🏅', isGlobal: false, tierCode: 'SSS', points: 40 },
      { name: 'Science Whiz', description: 'Excellence in Sciences', icon: '🔬', isGlobal: false, tierCode: 'SSS', points: 35 },
      { name: 'Commerce Champion', description: 'Excellence in Commercial subjects', icon: '📊', isGlobal: false, tierCode: 'SSS', points: 35 },
    ];

    const tiers = await prisma.tier.findMany({ where: { tenantId: demoTenant.id } });
    
    for (const badge of defaultBadges) {
      try {
        const tierId = badge.tierCode ? tiers.find(t => t.code === badge.tierCode)?.id : null;
        
        const existing = await prisma.badge.findFirst({
          where: { name: badge.name, tenantId: demoTenant.id }
        });
        
        if (!existing) {
          await prisma.badge.create({
            data: {
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              isGlobal: badge.isGlobal,
              tierId,
              tenantId: demoTenant.id,
              points: badge.points,
            }
          });
          console.log(`   ✓ Created badge: ${badge.name}`);
        }
      } catch (e) {
        console.log(`   ⚠ Badge ${badge.name}:`, e.message.slice(0, 50));
      }
    }
  }

  console.log('\n✅ Badge system migration completed!');
  await prisma.$disconnect();
}

runMigration().catch(console.error);
