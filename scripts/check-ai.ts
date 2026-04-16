import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function checkAISettings() {
  // Get all tenants with their settings
  const tenants = await prisma.tenant.findMany({
    include: {
      settings: {
        select: {
          aiEnabled: true,
          openRouterApiKey: true,
          openRouterModel: true
        }
      }
    },
    take: 5
  });
  
  console.log('Tenants and Settings:');
  for (const t of tenants) {
    console.log('- Tenant:', t.name, '(', t.id.substring(0, 8), ')');
    if (t.settings) {
      console.log('  aiEnabled:', t.settings.aiEnabled);
      console.log('  openRouterApiKey:', t.settings.openRouterApiKey ? 'SET' : 'NOT SET');
      console.log('  openRouterModel:', t.settings.openRouterModel);
    } else {
      console.log('  No settings found');
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkAISettings();