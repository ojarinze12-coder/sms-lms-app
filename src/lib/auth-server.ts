import { cookies, headers } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';
import { NextRequest } from 'next/server';

async function validateToken(token: string): Promise<JWTPayload | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('[auth-server] Token validation failed');
    return null;
  }
  console.log('[auth-server] Token valid for user:', decoded.userId, 'role:', decoded.role);
  return decoded;
}

export async function getAuthUser(request?: NextRequest): Promise<JWTPayload | null> {
  try {
    // First try Authorization header (for Vercel/production)
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[auth-server] Checking Authorization header');
      const result = await validateToken(token);
      if (result) return result;
    }
    
    // Fallback to cookies
    const cookieStore = await cookies();
    const pccToken = cookieStore.get('pcc-token')?.value;
    const sccToken = cookieStore.get('scc-token')?.value;
    const legacyToken = cookieStore.get('auth-token')?.value;

    console.log('[auth-server] Cookie check - pcc:', !!pccToken, 'scc:', !!sccToken, 'legacy:', !!legacyToken);

    if (pccToken) {
      return await validateToken(pccToken);
    }
    
    if (sccToken) {
      return await validateToken(sccToken);
    }
    
    if (legacyToken) {
      return await validateToken(legacyToken);
    }
    
    console.log('[auth-server] No auth found');
    return null;
  } catch (error) {
    console.error('[auth-server] Auth check error:', error);
    return null;
  }
}

export async function requireSuperAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  
  if (!user || user.role !== 'SUPER_ADMIN') {
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

  if (user.role === 'ADMIN' && !user.tenantId) {
    return null;
  }

  return user;
}