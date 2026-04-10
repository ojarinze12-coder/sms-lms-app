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
  console.log('Creating test users via Supabase...');

  // Get or create super admin tenant
  let { data: superAdminTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'super-admin-platform')
    .single();

  let tenantId: string;

  if (!superAdminTenant) {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Super Admin Platform',
        slug: 'super-admin-platform',
        plan: 'ENTERPRISE',
        brandColor: '#1a56db',
      })
      .select('id')
      .single();
    
    if (tenantError || !newTenant) {
      console.error('Error creating tenant:', tenantError);
      process.exit(1);
    }
    tenantId = newTenant.id;
    console.log('Created super admin tenant');
  } else {
    tenantId = superAdminTenant.id;
  }

  // Create Super Admin User
  const superAdminPassword = await hashPassword('superadmin123');
  
  const { error: superAdminError } = await supabase
    .from('users')
    .upsert({
      email: 'superadmin@edunext.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: tenantId,
    }, {
      onConflict: 'email'
    });

  if (superAdminError) {
    console.error('Error creating super admin:', superAdminError);
  } else {
    console.log('✅ Created SUPER_ADMIN: superadmin@edunext.com / superadmin123');
  }

  // Get or create demo school tenant
  let { data: demoTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'demo-school')
    .single();

  let demoTenantId: string;

  if (!demoTenant) {
    const { data: newDemoTenant, error: demoError } = await supabase
      .from('tenants')
      .insert({
        name: 'Demo School',
        slug: 'demo-school',
        plan: 'PROFESSIONAL',
        brandColor: '#059669',
      })
      .select('id')
      .single();
    
    if (demoError || !newDemoTenant) {
      console.error('Error creating demo tenant:', demoError);
      process.exit(1);
    }
    demoTenantId = newDemoTenant.id;
    console.log('Created demo school tenant');
  } else {
    demoTenantId = demoTenant.id;
  }

  // Create School Admin User
  const adminPassword = await hashPassword('admin123');
  
  const { error: adminError } = await supabase
    .from('users')
    .upsert({
      email: 'admin@demo-school.com',
      password: adminPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: 'ADMIN',
      tenantId: demoTenantId,
    }, {
      onConflict: 'email'
    });

  if (adminError) {
    console.error('Error creating admin:', adminError);
  } else {
    console.log('✅ Created ADMIN: admin@demo-school.com / admin123');
  }

  // Create Teacher User
  const teacherPassword = await hashPassword('teacher123');
  
  const { error: teacherError } = await supabase
    .from('users')
    .upsert({
      email: 'teacher@demo-school.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: 'TEACHER',
      tenantId: demoTenantId,
    }, {
      onConflict: 'email'
    });

  if (teacherError) {
    console.error('Error creating teacher:', teacherError);
  } else {
    console.log('✅ Created TEACHER: teacher@demo-school.com / teacher123');
  }

  // Create Student User
  const studentPassword = await hashPassword('student123');
  
  const { error: studentError } = await supabase
    .from('users')
    .upsert({
      email: 'student@demo-school.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'STUDENT',
      tenantId: demoTenantId,
    }, {
      onConflict: 'email'
    });

  if (studentError) {
    console.error('Error creating student:', studentError);
  } else {
    console.log('✅ Created STUDENT: student@demo-school.com / student123');
  }

  console.log('\n✅ Test users created successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });