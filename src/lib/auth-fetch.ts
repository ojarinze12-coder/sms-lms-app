// This hook provides authenticated API calls with automatic token handling

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add Authorization header if we have a token
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  // Always include credentials for cookie-based auth fallback
  if (!options.credentials) {
    options.credentials = 'include';
  }

  return fetch(url, {
    ...options,
    headers,
  });
}