'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const issuanceId = params.id;

    const issuance = await prisma.certificateIssuance.findFirst({
      where: {
        id: issuanceId,
        tenantId,
      },
      include: {
        student: true,
        template: true,
      },
    });

    if (!issuance) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const updatedIssuance = await prisma.certificateIssuance.update({
      where: {
        id: issuanceId,
      },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ issuance: updatedIssuance });
  } catch (error) {
    console.error('Error sending certificate:', error);
    return NextResponse.json({ error: 'Failed to send certificate' }, { status: 500 });
  }
}