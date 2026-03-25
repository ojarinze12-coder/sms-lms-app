import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetPassword(email: string, newPassword: string) {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', email)
    .select();
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Password updated for:', email);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: npx ts-node scripts/reset-password.ts <email> <password>');
  process.exit(1);
}

resetPassword(email, password);
