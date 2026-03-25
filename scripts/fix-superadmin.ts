import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First, get or create the Edunext Platform tenant
  let superAdminTenant = await prisma.tenant.findUnique({
    where: { slug: 'edunext-platform' }
  });
  
  if (!superAdminTenant) {
    superAdminTenant = await prisma.tenant.create({
      data: {
        name: 'Edunext Platform',
        slug: 'edunext-platform',
        domain: 'edunext.com',
        plan: 'ENTERPRISE',
        brandColor: '#1a56db',
      }
    });
    console.log('Created Edunext Platform tenant');
  }
  
  // Update superadmin user
  const superAdmin = await prisma.user.update({
    where: { email: 'superadmin@edunext.com' },
    data: {
      role: 'SUPER_ADMIN',
      tenantId: superAdminTenant.id
    }
  });
  
  console.log(`Updated superadmin: ${superAdmin.email} -> role=${superAdmin.role}, tenantId=${superAdmin.tenantId}`);
  
  // Verify
  const users = await prisma.user.findMany({
    where: { email: 'superadmin@edunext.com' },
    select: { email: true, role: true, tenantId: true }
  });
  console.log('\nVerification:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
