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

    const logs = await prisma.behaviorLog.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching behavior logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
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
      behaviorType,
      category,
      points,
      description,
      remarks,
    } = body;

    const log = await prisma.behaviorLog.create({
      data: {
        studentId,
        tenantId,
        date: date ? new Date(date) : new Date(),
        behaviorType,
        category,
        points: points || 0,
        description,
        remarks,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Error creating behavior log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}