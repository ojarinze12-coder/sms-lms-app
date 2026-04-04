'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      include: {
        student: true,
        academicYear: true,
        academicClass: true,
      },
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const academicRecords = await prisma.result.findMany({
      where: {
        studentId: transcript.studentId,
        exam: {
          academicYearId: transcript.academicYearId,
        },
      },
      include: {
        subject: true,
        exam: {
          include: {
            term: true,
          },
        },
      },
    });

    return NextResponse.json({ transcript, academicRecords });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const transcriptId = params.id;
    const body = await req.json();

    const { status, pdfUrl, sendingTo, purpose } = body;

    const transcript = await prisma.transcript.update({
      where: {
        id: transcriptId,
      },
      data: {
        ...(status && { status }),
        ...(pdfUrl && { pdfUrl }),
        ...(sendingTo && { sendingTo }),
        ...(purpose && { purpose }),
        ...(status === 'SENT' && { sentAt: new Date() }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
      include: {
        student: true,
        academicYear: true,
      },
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
  }
}