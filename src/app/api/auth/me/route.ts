import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    // First try cookies
    let authUser = await getAuthUser();
    
    // If no cookie auth, try Authorization header
    if (!authUser) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = verifyToken(token);
        console.log('[Auth Me] Token from header, result:', !!authUser);
      }
    }
    
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