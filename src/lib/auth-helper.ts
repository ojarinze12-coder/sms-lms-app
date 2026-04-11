import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export function getAuthFromRequest(request: NextRequest): JWTPayload | null {
  // First, check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = verifyToken(token);
    if (result) {
      console.log('[Auth] Found in Authorization header');
      return result;
    }
  }

  // Fallback: check cookies
  const pccToken = request.cookies.get('pcc-token')?.value;
  const sccToken = request.cookies.get('scc-token')?.value;
  const legacyToken = request.cookies.get('auth-token')?.value;

  console.log('[Auth] Cookie check - pcc:', !!pccToken, 'scc:', !!sccToken, 'legacy:', !!legacyToken);

  if (pccToken) {
    const result = verifyToken(pccToken);
    if (result) return result;
  }
  if (sccToken) {
    const result = verifyToken(sccToken);
    if (result) return result;
  }
  if (legacyToken) {
    const result = verifyToken(legacyToken);
    if (result) return result;
  }

  console.log('[Auth] No valid auth found');
  return null;
}