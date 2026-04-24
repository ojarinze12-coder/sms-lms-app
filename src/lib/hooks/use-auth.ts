'use client';

import { useEffect, useState } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_OWNER' | 'ADMIN' | 'PRINCIPAL' | 'VICE_PRINCIPAL' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN' | 'BURSAR' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  branchId?: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthUser extends JWTPayload {
  role: UserRole;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isSuperAdmin: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    async function checkAuth() {
      try {
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (localToken) {
          // First verify the local token
          const verifyRes = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${localToken}` },
            credentials: 'include',
          });
          
          if (verifyRes.ok && mounted) {
            const verifyData = await verifyRes.json();
            if (verifyData.user) {
              setUser(verifyData.user as AuthUser);
              setLoading(false);
              return;
            }
          }
        }
        
        // Fall back to /api/auth/me
        const headers: Record<string, string> = {};
        if (localToken) {
          headers['Authorization'] = `Bearer ${localToken}`;
        }
        
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        
        if (!mounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user as AuthUser);
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('[useAuth] Timeout - auth check taking too long, showing page anyway');
        setLoading(false);
      }
    }, 5000);
    
    checkAuth();
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const role = user?.role || null;
  
  return {
    user,
    role,
    loading,
    isAdmin: role === 'ADMIN',
    isTeacher: role === 'TEACHER',
    isStudent: role === 'STUDENT',
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}

export function hasAccess(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
