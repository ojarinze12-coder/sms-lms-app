import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireSuperAdmin } from '@/lib/auth-server';

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
  }

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return NextResponse.json({ error: 'DATABASE_URL not found' }, { status: 500 });
  }

  const pool = new Pool({ 
    connectionString,
    ssl: false
  });

  try {
    const client = await pool.connect();
    
    try {
      // Grant all permissions to public and service_role
      await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role`);
      await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO public`);
      await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role`);
      await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public`);
      await client.query(`GRANT USAGE ON SCHEMA public TO service_role`);
      await client.query(`GRANT USAGE ON SCHEMA public TO public`);
      
      // Also try granting to anon role (Supabase uses this)
      await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon`);
      await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`);
      await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon`);
      await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated`);
      
      // Ensure RLS is disabled
      await client.query(`ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY`);
      
      // Check current grants
      const result = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tenants', 'users')
      `);
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Permissions granted!',
        tables: result.rows
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (err: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: err.message 
    }, { status: 500 });
  }
}
