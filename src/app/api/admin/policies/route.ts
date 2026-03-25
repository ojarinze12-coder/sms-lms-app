import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const createPolicySchema = z.object({
  policyKey: z.string(),
  name: z.string(),
  description: z.string().optional(),
  policyType: z.enum(['MFA_ENFORCEMENT', 'PASSWORD_POLICY', 'SESSION_TIMEOUT', 'API_RATE_LIMIT', 'DATA_RETENTION', 'EXPORT_LIMIT']),
  config: z.record(z.any()).optional(),
  appliesTo: z.array(z.enum(['ALL_TENANTS', 'NEW_TENANTS', 'ENTERPRISE_ONLY', 'SPECIFIC_PLAN'])).optional(),
});

const updatePolicySchema = createPolicySchema.partial();

export async function GET(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policies = await prisma.globalPolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const policiesWithStats = await Promise.all(
      policies.map(async (policy) => {
        let affectedTenants = 0;
        
        if (policy.appliesTo.includes('ALL_TENANTS')) {
          affectedTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
        } else if (policy.appliesTo.includes('ENTERPRISE_ONLY')) {
          affectedTenants = await prisma.tenant.count({ 
            where: { plan: 'ENTERPRISE', status: 'ACTIVE' } 
          });
        }

        return {
          ...policy,
          affectedTenants,
        };
      })
    );

    return NextResponse.json({ policies: policiesWithStats });
  } catch (error) {
    console.error('Admin Policies GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await requireSuperAdmin();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createPolicySchema.parse(body);

    const existingPolicy = await prisma.globalPolicy.findUnique({
      where: { policyKey: validatedData.policyKey },
    });

    if (existingPolicy) {
      return NextResponse.json(
        { error: 'Policy with this key already exists' },
        { status: 400 }
      );
    }

    const policy = await prisma.globalPolicy.create({
      data: {
        policyKey: validatedData.policyKey,
        name: validatedData.name,
        description: validatedData.description,
        policyType: validatedData.policyType,
        config: validatedData.config || {},
        appliesTo: validatedData.appliesTo || ['ALL_TENANTS'],
        createdBy: authUser.userId,
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: authUser.userId,
        actorEmail: authUser.email,
        action: 'POLICY_CREATED',
        actionType: 'CREATE',
        category: 'SECURITY',
        targetType: 'policy',
        targetId: policy.id,
        targetName: policy.name,
        description: `Created global policy: ${policy.name}`,
      },
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin Policies POST error:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
