import { prisma } from '@/lib/prisma';
import { getClientIp } from './security';

export type PlatformAction = 
  | 'TENANT_CREATE'
  | 'TENANT_UPDATE'
  | 'TENANT_SUSPEND'
  | 'TENANT_DELETE'
  | 'PLAN_CHANGE'
  | 'SUPER_ADMIN_LOGIN'
  | 'SUPER_ADMIN_LOGIN_FAILED'
  | 'SUPER_ADMIN_2FA_ENABLED'
  | 'SUPER_ADMIN_2FA_DISABLED'
  | 'SUPER_ADMIN_PASSWORD_CHANGE'
  | 'SUPER_ADMIN_IP_ADD'
  | 'SUPER_ADMIN_IP_REMOVE'
  | 'BACKUP_CREATE'
  | 'SETTINGS_CHANGE'
  | 'SUPPORT_TICKET_ASSIGN'
  | 'SUPPORT_TICKET_RESOLVE';

export interface PlatformAuditLogParams {
  action: PlatformAction;
  userId: string;
  targetId?: string;
  targetType?: string;
  description: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logPlatformAudit(params: PlatformAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.targetType || 'PLATFORM',
        entityId: params.targetId,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        userId: params.userId,
        tenantId: null,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('Platform audit logging error:', error);
  }
}

export async function getPlatformAuditLogs(limit: number = 100, offset: number = 0) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: null },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    return logs;
  } catch (error) {
    console.error('Failed to get platform audit logs:', error);
    return [];
  }
}
