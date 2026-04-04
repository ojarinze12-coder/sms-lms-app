'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const templates = await prisma.certificateTemplate.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();

    const {
      name,
      description,
      category,
      templateData,
      layout,
      isActive,
      autoIssue,
      criteria,
      schoolName,
      schoolLogo,
      sealImage,
      signatureImage,
    } = body;

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        description,
        category: category || 'COMPLETION',
        templateData,
        layout: layout || 'A4_PORTRAIT',
        isActive: isActive !== false,
        autoIssue: autoIssue || false,
        criteria,
        schoolName,
        schoolLogo,
        sealImage,
        signatureImage,
        tenantId,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json({ error: 'Failed to create certificate template' }, { status: 500 });
  }
}