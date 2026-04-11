// Auth-aware fetch - use this instead of fetch for authenticated API calls
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

// Hook version for React components
'use client';
import { useState, useEffect } from 'react';

export function useAuthFetch<T>(url: string, options?: RequestInit): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(url, options)
      .then(res => {
        if (res.status === 401) {
          setError('Session expired');
          return null;
        }
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}