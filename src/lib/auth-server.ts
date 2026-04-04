import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function validateToken(token: string): Promise<JWTPayload | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('[AUTH] Token verification failed');
    return null;
  }

  console.log('[AUTH] Token decoded:', { userId: decoded.userId, role: decoded.role, tokenVersion: decoded.tokenVersion, tenantId: decoded.tenantId });

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { tokenVersion: true },
  });

  console.log('[AUTH] DB tokenVersion:', user?.tokenVersion);

  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    console.log('[AUTH] Token version mismatch');
    return null;
  }

  console.log('[AUTH] Token valid, returning user with role:', decoded.role, 'tenantId:', decoded.tenantId);
  return decoded;
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    
    const pccToken = cookieStore.get('pcc-token')?.value;
    const sccToken = cookieStore.get('scc-token')?.value;
    const legacyToken = cookieStore.get('auth-token')?.value;

    console.log('[AUTH] Cookies found:', {
      hasPccToken: !!pccToken,
      hasSccToken: !!sccToken,
      hasLegacyToken: !!legacyToken,
    });

    if (pccToken) {
      console.log('[AUTH] Using pcc-token');
      return await validateToken(pccToken);
    }
    
    if (sccToken) {
      console.log('[AUTH] Using scc-token');
      return await validateToken(sccToken);
    }
    
    if (legacyToken) {
      console.log('[AUTH] Using legacy auth-token');
      return await validateToken(legacyToken);
    }
    
    console.log('[AUTH] No token found');
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

export async function requireSuperAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  
  console.log('[requireSuperAdmin] User:', { userId: user?.userId, role: user?.role, tenantId: user?.tenantId });
  
  if (!user) {
    return null;
  }
  
  if (user.role !== 'SUPER_ADMIN') {
    console.log('[requireSuperAdmin] Not SUPER_ADMIN, role:', user.role);
    return null;
  }
  
  return user;
}

export async function requireAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  
  console.log('[requireAdmin] User:', { userId: user?.userId, role: user?.role, tenantId: user?.tenantId });
  
  if (!user) {
    return null;
  }
  
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return null;
  }

  // Only require tenantId for ADMIN role, not SUPER_ADMIN
  if (user.role === 'ADMIN' && !user.tenantId) {
    console.log('[requireAdmin] No tenantId for ADMIN user:', user.userId);
    return null;
  }

  return user;
}
