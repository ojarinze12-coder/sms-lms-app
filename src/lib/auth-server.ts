import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

export async function requireSuperAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  
  if (!user) {
    return null;
  }
  
  if (user.role !== 'SUPER_ADMIN') {
    return null;
  }
  
  return user;
}

export async function requireAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  
  if (!user) {
    return null;
  }
  
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return null;
  }
  
  return user;
}
