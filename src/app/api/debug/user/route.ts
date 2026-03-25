import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', user: null }, { status: 404 });
    }

    // If new password provided, update it
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Password updated successfully',
        user: { id: user.id, email: user.email, role: user.role }
      });
    }

    // Otherwise, just return user info
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0
      } 
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}