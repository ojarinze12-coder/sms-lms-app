import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Starting seed via Supabase...');

  // Get or create demo school tenant
  let { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'demo-school')
    .single();

  let tenantId: string;

  if (!tenant) {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Demo School',
        slug: 'demo-school',
        plan: 'FREE',
        brandColor: '#059669',
      })
      .select('id')
      .single();
    
    if (tenantError || !newTenant) {
      console.error('Error creating tenant:', tenantError);
      process.exit(1);
    }
    tenantId = newTenant.id;
    console.log('Created demo school tenant');
  } else {
    tenantId = tenant.id;
  }

  // Create Teacher User
  const teacherPassword = await hashPassword('teacher123');
  
  const { error: teacherError } = await supabase
    .from('users')
    .upsert({
      email: 'teacher@demo-school.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'TEACHER',
      tenantId: tenantId,
    }, {
      onConflict: 'email'
    });

  if (teacherError) {
    console.error('Error creating teacher user:', teacherError);
  } else {
    console.log('Created teacher user: teacher@demo-school.com / teacher123');
  }

  // Create Student User
  const studentPassword = await hashPassword('student123');
  
  const { error: studentError } = await supabase
    .from('users')
    .upsert({
      email: 'student@demo-school.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'STUDENT',
      tenantId: tenantId,
    }, {
      onConflict: 'email'
    });

  if (studentError) {
    console.error('Error creating student user:', studentError);
  } else {
    console.log('Created student user: student@demo-school.com / student123');
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  });
