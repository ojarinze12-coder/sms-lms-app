import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PRINCIPAL' | 'VICE_PRINCIPAL' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN' | 'BURSAR' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SENIOR_TEACHER' | 'HOD' | 'FORM_MASTER';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'manage:tenants',
    'manage:users',
    'manage:academics',
    'manage:exams',
    'manage:results',
    'manage:reports',
    'manage:finance',
    'manage:payroll',
    'view:analytics',
    'ai:generate',
  ],
  ADMIN: [
    'manage:users',
    'manage:academics',
    'manage:exams',
    'manage:results',
    'manage:reports',
    'manage:finance',
    'manage:payroll',
    'view:analytics',
    'ai:generate',
  ],
  PRINCIPAL: [
    'manage:users',
    'manage:academics',
    'manage:exams',
    'manage:results',
    'manage:reports',
    'view:analytics',
    'ai:generate',
  ],
  VICE_PRINCIPAL: [
    'manage:academics',
    'manage:exams',
    'manage:results',
    'view:reports',
    'view:analytics',
  ],
  ACADEMIC_ADMIN: [
    'manage:academics',
    'manage:exams',
    'manage:results',
    'view:reports',
    'view:analytics',
  ],
  FINANCE_ADMIN: [
    'manage:finance',
    'manage:fees',
    'view:reports',
    'view:analytics',
  ],
  BURSAR: [
    'manage:finance',
    'manage:fees',
    'manage:payments',
    'view:reports',
  ],
  SENIOR_TEACHER: [
    'view:teachers',
    'manage:subjects',
    'view:department',
    'view:academics',
    'manage:exams',
    'manage:results',
    'view:reports',
    'ai:generate',
  ],
  HOD: [
    'manage:department:teachers',
    'view:department:results',
    'manage:department:exams',
    'approve:results',
    'view:teachers',
    'manage:subjects',
    'view:academics',
    'view:reports',
    'ai:generate',
  ],
  FORM_MASTER: [
    'mark:attendance',
    'view:class:results',
    'manage:class:results',
    'view:class:students',
    'view:academics',
    'view:reports',
  ],
  TEACHER: [
    'view:academics',
    'view:assigned:class',
    'manage:exams',
    'manage:results',
    'view:reports',
    'ai:generate',
  ],
  STUDENT: [
    'view:exams',
    'take:exams',
    'view:results',
    'view:reports',
  ],
  PARENT: [
    'view:child:results',
    'view:child:reports',
    'view:child:attendance',
  ],
};

export async function checkPermission(
  user: JWTPayload | null,
  permission: string
): Promise<boolean> {
  if (!user) return false;

  if (user.role === 'SUPER_ADMIN') return true;

  const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
  return permissions.includes(permission);
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload | null> {
  const pccToken = request.cookies.get('pcc-token')?.value;
  const sccToken = request.cookies.get('scc-token')?.value;
  const legacyToken = request.cookies.get('auth-token')?.value;
  
  console.log('[requireAuth] pcc:', !!pccToken, 'scc:', !!sccToken, 'legacy:', !!legacyToken);
  
  if (pccToken) {
    const result = verifyToken(pccToken);
    console.log('[requireAuth] pccToken result:', !!result);
    return result;
  }
  if (sccToken) {
    const result = verifyToken(sccToken);
    console.log('[requireAuth] sccToken result:', !!result);
    return result;
  }
  if (legacyToken) {
    const result = verifyToken(legacyToken);
    console.log('[requireAuth] legacyToken result:', !!result);
    return result;
  }
  
  console.log('[requireAuth] No token found');
  return null;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<JWTPayload | null> {
  const user = await requireAuth(request);
  
  if (!user) return null;
  
  if (!allowedRoles.includes(user.role as UserRole)) return null;
  
  return user;
}

export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<JWTPayload | null> {
  const user = await requireAuth(request);
  
  if (!user) return null;
  
  const hasPermission = await checkPermission(user, permission);
  
  if (!hasPermission) return null;
  
  return user;
}

export function hasRole(user: JWTPayload | null, role: UserRole): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.role === role;
}

export function hasAnyRole(user: JWTPayload | null, roles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return roles.includes(user.role as UserRole);
}

export async function getTenantId(request: NextRequest): Promise<string | null> {
  const user = await requireAuth(request);
  return user?.tenantId || null;
}

export async function validateTenantAccess(
  request: NextRequest,
  resourceTenantId: string
): Promise<boolean> {
  const user = await requireAuth(request);
  
  if (!user) return false;
  
  if (user.role === 'SUPER_ADMIN') return true;
  
  return user.tenantId === resourceTenantId;
}
