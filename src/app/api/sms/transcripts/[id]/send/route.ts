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
    const transcriptId = params.id;

    const transcript = await prisma.transcript.findFirst({
      where: {
        id: transcriptId,
        tenantId,
      },
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const updatedTranscript = await prisma.transcript.update({
      where: {
        id: transcriptId,
      },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        student: true,
        academicYear: true,
      },
    });

    return NextResponse.json({ transcript: updatedTranscript });
  } catch (error) {
    console.error('Error sending transcript:', error);
    return NextResponse.json({ error: 'Failed to send transcript' }, { status: 500 });
  }
}