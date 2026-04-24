// Authenticated API calls with automatic token handling from localStorage and cookies
import { useRouter } from 'next/navigation';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('auth_token', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return authToken;
  return localStorage.getItem('auth_token') || authToken;
}

function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Prevent URL doubling
  if (url.includes('/api/sms/parents/approve/api/sms/parents/approve')) {
    url = '/api/sms/parents/approve';
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getAuthToken();
  console.log('[authFetch] Token:', token ? 'present' : 'missing', 'URL:', url);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    credentials: options.credentials || 'include',
    headers,
  };

  return fetch(url, fetchOptions);
}

export async function logout(): Promise<void> {
  clearAuthToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.error('Logout error:', e);
  }
}