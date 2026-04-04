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

    const logs = await prisma.behaviorLog.findMany({
      where: {
        studentId,
        tenantId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching behavior logs:', error);
    return NextResponse.json({ error: 'Failed to fetch behavior logs' }, { status: 500 });
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
      behaviorType,
      category,
      points,
      description,
      remarks,
      teacherId,
      classId,
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
        teacherId,
        classId,
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Error creating behavior log:', error);
    return NextResponse.json({ error: 'Failed to create behavior log' }, { status: 500 });
  }
}