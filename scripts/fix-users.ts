import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Users ===\n');

  // Get all users with their tenant info
  const users = await prisma.user.findMany({
    include: { tenant: true },
    orderBy: { role: 'asc' }
  });

  console.log('Current Users:');
  console.log('----------------');
  for (const user of users) {
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`TenantId: ${user.tenantId || 'NULL'}`);
    console.log(`Tenant: ${user.tenant?.name || 'N/A'}`);
    console.log('----------------');
  }

  // Get all tenants
  const tenants = await prisma.tenant.findMany();
  console.log('\nAvailable Tenants:');
  for (const tenant of tenants) {
    console.log(`- ${tenant.id}: ${tenant.name} (${tenant.slug})`);
  }

  // If there are ADMIN users with NULL tenantId, let's show what to do
  const adminUsersWithoutTenant = users.filter(u => u.role === 'ADMIN' && !u.tenantId);
  if (adminUsersWithoutTenant.length > 0) {
    console.log('\n⚠️  ADMIN users without tenantId:');
    for (const user of adminUsersWithoutTenant) {
      console.log(`  - ${user.email}`);
    }
    console.log('\nTo fix, update these users with a valid tenantId:');
    console.log('  await prisma.user.update({');
    console.log('    where: { id: "<user-id>" },');
    console.log('    data: { tenantId: "<tenant-id>" }');
    console.log('  });');
  }

  // SUPER_ADMIN users should work now with the code fix
  const superAdminUsers = users.filter(u => u.role === 'SUPER_ADMIN');
  if (superAdminUsers.length > 0) {
    console.log('\n✓ SUPER_ADMIN users (should work after code fix):');
    for (const user of superAdminUsers) {
      console.log(`  - ${user.email} (tenantId: ${user.tenantId || 'NULL - OK'})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
