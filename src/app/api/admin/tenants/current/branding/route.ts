import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const brandingSchema = z.object({
  logo: z.string().nullable().optional(),
  brandColor: z.string().optional(),
  parentPortalEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        brandColor: true,
      }
    } as any);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = brandingSchema.parse(body);

    const updateData: any = {};
    
    if (data.logo !== undefined) {
      updateData.logo = data.logo;
    }
    
    if (data.brandColor !== undefined) {
      updateData.brandColor = data.brandColor;
    }

    if (data.parentPortalEnabled !== undefined) {
      updateData.settings = {
        parentPortalEnabled: data.parentPortalEnabled,
      };
    }

    const tenant = await prisma.tenant.update({
      where: { id: authUser.tenantId },
      data: updateData,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating tenant branding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
