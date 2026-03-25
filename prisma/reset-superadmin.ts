import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting Super Admin password...');

  const email = 'superadmin@edunext.com';
  const newPassword = 'SuperAdmin@2024#Secure!';

  // Hash the password with bcrypt (12 rounds for strong security)
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update the user with correct role and password
  const result = await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword,
      role: 'SUPER_ADMIN',  // Ensure role is SUPER_ADMIN
    },
  });

  console.log('Password updated for:', result.email);
  console.log('Role:', result.role);
  console.log('ID:', result.id);
  console.log('\n✅ Super Admin is now ready!');
  console.log('Login with: superadmin@edunext.com / SuperAdmin@2024#Secure!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
