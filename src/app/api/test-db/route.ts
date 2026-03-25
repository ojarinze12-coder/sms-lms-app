import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Test 1: Check if tenants table exists and is accessible
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .limit(5);

    if (tenantsError) {
      return NextResponse.json({
        test: 'tenants table',
        status: 'error',
        error: tenantsError,
        hint: 'Table might not exist or RLS blocking access'
      }, { status: 500 });
    }

    // Test 2: Check if users table exists
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      return NextResponse.json({
        test: 'users table',
        status: 'error',
        error: usersError
      }, { status: 500 });
    }

    // Test 3: Try to create a test tenant
    const testSlug = 'test-' + Date.now();
    const { data: newTenant, error: createError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: 'Test School',
        slug: testSlug,
        plan: 'FREE',
        brandColor: '#1a56db'
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({
        test: 'create tenant',
        status: 'error',
        error: createError,
        hint: 'Check if enum types exist'
      }, { status: 500 });
    }

    // Clean up test tenant
    await supabaseAdmin.from('tenants').delete().eq('id', newTenant.id);

    return NextResponse.json({
      status: 'success',
      tenantsCount: tenants?.length || 0,
      usersCount: users?.length || 0,
      message: 'All database operations working correctly!'
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
