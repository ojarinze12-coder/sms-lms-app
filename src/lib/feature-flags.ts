import { prisma } from '@/lib/prisma';

export type FeatureKey = 
  | 'ai_timetable'
  | 'ai_exam_generator'
  | 'sms_notifications'
  | 'whatsapp_notifications'
  | 'custom_domain'
  | 'priority_support'
  | 'advanced_analytics'
  | 'api_access';

export async function getTenantFeatures(tenantId: string): Promise<Record<string, boolean>> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptions: {
        include: { subscriptionPlan: true },
      },
    },
  });

  const subscription = tenant?.subscriptions?.[0];
  
  if (!subscription?.subscriptionPlan) {
    return getDefaultFeatures('FREE');
  }

  const planFeatures = subscription.subscriptionPlan.features as Record<string, any>;
  return {
    ...getDefaultFeatures(subscription.subscriptionPlan.name),
    ...planFeatures,
  };
}

export async function hasFeature(tenantId: string, feature: FeatureKey): Promise<boolean> {
  const features = await getTenantFeatures(tenantId);
  return features[feature] ?? false;
}

export async function checkFeatureAccess(
  tenantId: string,
  feature: FeatureKey
): Promise<{ allowed: boolean; reason?: string }> {
  const hasAccess = await hasFeature(tenantId, feature);
  
  if (hasAccess) {
    return { allowed: true };
  }

  const featureNames: Record<FeatureKey, string> = {
    ai_timetable: 'AI Timetable Generation',
    ai_exam_generator: 'AI Exam Generator',
    sms_notifications: 'SMS Notifications',
    whatsapp_notifications: 'WhatsApp Notifications',
    custom_domain: 'Custom Domain',
    priority_support: 'Priority Support',
    advanced_analytics: 'Advanced Analytics',
    api_access: 'API Access',
  };

  return {
    allowed: false,
    reason: `This feature (${featureNames[feature]}) requires a plan upgrade`,
  };
}

function getDefaultFeatures(planName: string): Record<string, boolean> {
  const defaults: Record<string, Record<string, boolean>> = {
    FREE: {
      ai_timetable: false,
      ai_exam_generator: false,
      sms_notifications: false,
      whatsapp_notifications: false,
      custom_domain: false,
      priority_support: false,
      advanced_analytics: false,
      api_access: false,
    },
    STARTER: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: false,
      custom_domain: false,
      priority_support: false,
      advanced_analytics: false,
      api_access: false,
    },
    PROFESSIONAL: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: true,
      custom_domain: true,
      priority_support: false,
      advanced_analytics: true,
      api_access: true,
    },
    ENTERPRISE: {
      ai_timetable: true,
      ai_exam_generator: true,
      sms_notifications: true,
      whatsapp_notifications: true,
      custom_domain: true,
      priority_support: true,
      advanced_analytics: true,
      api_access: true,
    },
  };

  return defaults[planName] || defaults.FREE;
}

export async function getTenantLimits(tenantId: string): Promise<{
  maxStudents: number;
  maxTeachers: number;
  maxStorageGB: number;
  maxAICalls: number;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptions: {
        include: { subscriptionPlan: true },
      },
    },
  });

  const subscription = tenant?.subscriptions?.[0];
  
  if (!subscription?.subscriptionPlan) {
    return { maxStudents: 100, maxTeachers: 10, maxStorageGB: 1, maxAICalls: 0 };
  }

  return {
    maxStudents: subscription.subscriptionPlan.maxStudents,
    maxTeachers: subscription.subscriptionPlan.maxTeachers,
    maxStorageGB: subscription.subscriptionPlan.maxStorageGB,
    maxAICalls: subscription.subscriptionPlan.maxAICalls,
  };
}

export async function checkLimit(
  tenantId: string,
  resource: 'students' | 'teachers' | 'storage' | 'ai_calls',
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const limits = await getTenantLimits(tenantId);
  
  let limit: number;
  switch (resource) {
    case 'students':
      limit = limits.maxStudents;
      break;
    case 'teachers':
      limit = limits.maxTeachers;
      break;
    case 'storage':
      limit = limits.maxStorageGB;
      break;
    case 'ai_calls':
      limit = limits.maxAICalls;
      break;
    default:
      limit = 0;
  }

  if (limit === 0) {
    return { allowed: true, current: currentCount, limit: 0, remaining: -1 };
  }

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}
