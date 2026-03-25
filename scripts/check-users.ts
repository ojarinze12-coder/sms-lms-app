import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      firstName: true,
      lastName: true,
    }
  });
  
  console.log('Users in database:');
  users.forEach(u => {
    console.log(`- ${u.email}: role=${u.role}, tenantId=${u.tenantId}, name=${u.firstName} ${u.lastName}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
