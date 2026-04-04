import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Map admin emails to tenant IDs based on name matching
  const emailToTenantMap: Record<string, string> = {
    'sadmin@edunext.com': 'c4c9da4f-4844-4422-a5de-969d24b72014', // EduNext Platform
    'admin@testschool.com': '8abc9862-6191-4bbc-918d-122dda22a8e0', // Test School
    'admin@demo-school.com': '47173cf2-ad97-4ae3-baed-a7d1804fb2b2', // Demo School
    'admin@royalacademy.com': '55d96f59-2d80-43d0-9559-6c271beb7f96', // Royal Academy Nigeria
    'admin@greenfield.com': '70db0230-60da-4583-8184-5ff030e24813', // Greenfield International School
    'admin@brightstars.com': 'e4475733-1065-4b0f-80dd-bc9e4ffeabcb', // Bright Stars School
    'admin@excelcollege.com': 'bdb1f60e-def8-4c38-bef7-ab357c2cb41c', // Excel College
    'admin@lekki-high-school.com': '4e067191-9524-4144-9850-c7087c440161', // Lekki High School
  };

  console.log('=== Mapping ADMIN users to Tenants ===\n');

  let updated = 0;
  for (const [email, tenantId] of Object.entries(emailToTenantMap)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.role === 'ADMIN') {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tenantId: tenantId }
        });
        console.log(`✓ Updated ${email} -> ${tenant.name}`);
        updated++;
      }
    }
  }

  if (updated === 0) {
    console.log('No users updated (they may already have tenantId or email mismatch)');
  }

  console.log(`\n=== Updated ${updated} users ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
