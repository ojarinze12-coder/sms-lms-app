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
    const studentId = searchParams.get('studentId');

    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;

    const incidents = await prisma.behaviorIncident.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching behavior incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
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
      studentId,
      date,
      incidentType,
      severity,
      location,
      description,
      actionTaken,
      actionType,
      parentNotified,
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
        actionTaken,
        actionType,
        parentNotified: parentNotified || false,
        status: status || 'OPEN',
        reportedById: session.user.id,
        createdById: session.user.id,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
    });

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}