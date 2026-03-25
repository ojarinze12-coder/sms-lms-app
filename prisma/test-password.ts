import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@edunext.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', user.email);
  console.log('Role:', user.role);
  console.log('Password hash:', user.password?.slice(0, 50) + '...');
  console.log('Password length:', user.password?.length);

  // Test password
  const testPassword = 'SuperAdmin@2024#Secure!';
  const isValid = bcrypt.compareSync(testPassword, user.password || '');
  console.log('\nPassword test result:', isValid);

  // Generate new hash and test
  const newHash = bcrypt.hashSync(testPassword, 12);
  const isNewValid = bcrypt.compareSync(testPassword, newHash);
  console.log('New hash test:', isNewValid);

  // Try updating with new hash
  if (!isValid) {
    console.log('\nUpdating password with fresh hash...');
    await prisma.user.update({
      where: { email },
      data: { password: newHash },
    });
    console.log('Password updated with fresh hash');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
