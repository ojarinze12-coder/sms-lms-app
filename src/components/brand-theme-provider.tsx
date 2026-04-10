'use client';

import { useEffect, useState, createContext, useContext, useRef } from 'react';

interface TenantBranding {
  name?: string;
  logo?: string | null;
  brandColor?: string;
}

interface BrandThemeContextType {
  branding: TenantBranding;
  loading: boolean;
  primaryColor: string;
  primaryHsl: { h: number; s: number; l: number };
  updateBranding: (branding: Partial<TenantBranding>) => void;
}

const defaultHsl: { h: number; s: number; l: number } = { h: 217, s: 91, l: 45 };

const BrandThemeContext = createContext<BrandThemeContextType>({
  branding: {},
  loading: true,
  primaryColor: '#1a56db',
  primaryHsl: defaultHsl,
  updateBranding: () => {},
});

export const useBrandTheme = () => useContext(BrandThemeContext);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>({});
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    async function fetchBranding() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          
          let tenantBranding: TenantBranding = {};
          
          if (data.user?.tenant) {
            tenantBranding = {
              name: data.user.tenant.name,
              logo: data.user.tenant.logo,
              brandColor: data.user.tenant.brandColor || '#1a56db'
            };
          } else if (data.user?.role === 'SUPER_ADMIN') {
            tenantBranding = {
              name: 'Platform Control',
              logo: null,
              brandColor: '#1a56db'
            };
          }
          
          setBranding(tenantBranding);
        }
      } catch (err) {
        console.error('Failed to fetch branding:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBranding();
  }, []);

  const updateBranding = (newBranding: Partial<TenantBranding>) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  const primaryColor = branding.brandColor || '#1a56db';
  const primaryHsl = hexToHsl(primaryColor);

  useEffect(() => {
    if (!loading) {
      const root = document.documentElement;
      
      root.style.setProperty('--brand-primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      root.style.setProperty('--brand-primary-hover', `${primaryHsl.h} ${primaryHsl.s}% ${Math.max(primaryHsl.l - 10, 10)}%`);
      root.style.setProperty('--brand-primary-light', `${primaryHsl.h} ${primaryHsl.s}% ${Math.min(primaryHsl.l + 40, 95)}%`);
      
      root.style.setProperty('--brand-ring', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
    }
  }, [loading, primaryHsl]);

  return (
    <BrandThemeContext.Provider value={{ branding, loading, primaryColor, primaryHsl, updateBranding }}>
      {children}
    </BrandThemeContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandThemeContext);
}
