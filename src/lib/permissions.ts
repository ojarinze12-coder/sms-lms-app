import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAuth, 
  requireRole, 
  requirePermission,
  UserRole,
  ROLE_PERMISSIONS 
} from '@/lib/rbac';

type RouteHandler = (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse>;

interface RouteProtection {
  roles?: UserRole[];
  permission?: string;
  requireAuth?: boolean;
}

export function withAuth(
  handler: RouteHandler,
  protection: RouteProtection = {}
) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const { roles, permission, requireAuth: isAuthRequired = true } = protection;

    if (isAuthRequired) {
      const user = await requireAuth(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (roles && roles.length > 0) {
        const userRole = user.role as UserRole;
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const hasRole = isSuperAdmin || roles.includes(userRole);
        
        if (!hasRole) {
          return NextResponse.json(
            { error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      if (permission) {
        const hasPermission = ROLE_PERMISSIONS[user.role as UserRole]?.includes(permission) || 
                              user.role === 'SUPER_ADMIN';
        
        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Forbidden - Missing required permission' },
            { status: 403 }
          );
        }
      }
    }

    return handler(request, context);
  };
}

export function withTenantIsolation(handler: RouteHandler) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    
    if (tenantId && user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this tenant' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}
