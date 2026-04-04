'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function useTenantTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndApplyTheme() {
      try {
        const res = await fetch('/api/school/settings');
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

    if (loading) {
      fetchAndApplyTheme();
    }
  }, [theme, setTheme, loading]);

  return { theme, resolvedTheme, setTheme, loading };
}
