'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';

export function useTenantTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    async function fetchAndApplyTheme() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch('/api/school/settings', { 
          credentials: 'include',
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const tenantTheme = data.settings?.themeMode?.toLowerCase() || 'system';
          
          if (tenantTheme !== 'system') {
            if (theme !== tenantTheme) {
              setTheme(tenantTheme);
            }
          } else {
            if (theme === 'light' || theme === 'dark') {
              setTheme('system');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch tenant theme:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndApplyTheme();
  }, [theme, setTheme]);

  return { theme, resolvedTheme, setTheme, loading };
}
