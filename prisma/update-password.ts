import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newHash = '$2a$12$e5QaRQ/j1HmEw.hE7tb.huF.e7ZpUq3BfxejXGOGvsEw6O3EcwIyK';
  
  await prisma.user.update({
    where: { email: 'superadmin@edunext.com' },
    data: { password: newHash }
  });
  
  console.log('Password updated');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
