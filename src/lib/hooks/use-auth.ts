'use client';

import { useEffect, useState } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PRINCIPAL' | 'VICE_PRINCIPAL' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN' | 'BURSAR' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
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
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user as AuthUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
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
