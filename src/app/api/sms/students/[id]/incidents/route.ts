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
    const studentId = params.id;

    const incidents = await prisma.behaviorIncident.findMany({
      where: {
        studentId,
        tenantId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching behavior incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch behavior incidents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const studentId = params.id;
    const body = await req.json();

    const {
      date,
      incidentType,
      severity,
      location,
      description,
      witnesses,
      actionTaken,
      actionType,
      parentNotified,
      parentContact,
      followUpDate,
      followUpNotes,
      status,
    } = body;

    const incident = await prisma.behaviorIncident.create({
      data: {
        studentId,
        tenantId,
        date: date ? new Date(date) : new Date(),
        incidentType,
        severity: severity || 'LOW',
        location,
        description,
        witnesses,
        actionTaken,
        actionType,
        parentNotified: parentNotified || false,
        parentContact,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes,
        status: status || 'OPEN',
        reportedById: session.user.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error creating behavior incident:', error);
    return NextResponse.json({ error: 'Failed to create behavior incident' }, { status: 500 });
  }
}