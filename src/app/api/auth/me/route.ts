import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  try {
    console.log('[Auth Me] Checking auth...');
    const authUser = await getAuthUser();
    console.log('[Auth Me] User:', authUser ? { userId: authUser.userId, role: authUser.role } : 'null');
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated', user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      user: {
        id: authUser.userId,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        role: authUser.role,
        tenantId: authUser.tenantId,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}