import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';

async function validateToken(token: string): Promise<JWTPayload | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  return decoded;
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    
    const pccToken = cookieStore.get('pcc-token')?.value;
    const sccToken = cookieStore.get('scc-token')?.value;
    const legacyToken = cookieStore.get('auth-token')?.value;

    if (pccToken) {
      return await validateToken(pccToken);
    }
    
    if (sccToken) {
      return await validateToken(sccToken);
    }
    
    if (legacyToken) {
      return await validateToken(legacyToken);
    }
    
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
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