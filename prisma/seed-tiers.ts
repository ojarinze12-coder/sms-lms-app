import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

const TIERS = [
  { name: 'Creche', code: 'CRE', order: 0 },
  { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
  { name: 'Nursery', code: 'NUR', order: 2 },
  { name: 'Primary', code: 'PRI', order: 3 },
  { name: 'JSS', code: 'JSS', order: 4 },
  { name: 'SSS', code: 'SSS', order: 5 },
];

async function main() {
  console.log('Seeding tiers for existing tenants...');

  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
  });

  console.log(`Found ${tenants.length} tenants`);

  for (const tenant of tenants) {
    for (const tier of TIERS) {
      const existing = await prisma.tier.findFirst({
        where: { tenantId: tenant.id, code: tier.code }
      });
      
      if (!existing) {
        await prisma.tier.create({
          data: {
            name: tier.name,
            code: tier.code,
            order: tier.order,
            tenantId: tenant.id,
          },
        });
        console.log(`  Created tier ${tier.name} (${tier.code}) for tenant ${tenant.slug}`);
      } else {
        if (existing.order !== tier.order || existing.name !== tier.name) {
          await prisma.tier.update({
            where: { id: existing.id },
            data: { name: tier.name, order: tier.order },
          });
          console.log(`  Updated tier ${tier.name} (${tier.code}) order to ${tier.order} for tenant ${tenant.slug}`);
        } else {
          console.log(`  Tier ${tier.name} (${tier.code}) order=${existing.order} is correct`);
        }
      }
    }
  }

  console.log('\nTiers seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });