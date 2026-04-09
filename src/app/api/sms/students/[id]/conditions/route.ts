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

    const conditions = await prisma.studentChronicCondition.findMany({
      where: {
        studentId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ conditions });
  } catch (error) {
    console.error('Error fetching chronic conditions:', error);
    return NextResponse.json({ error: 'Failed to fetch chronic conditions' }, { status: 500 });
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
      condition,
      diagnosedDate,
      status,
      severity,
      treatment,
      medication,
      nextCheckup,
      notes,
    } = body;

    const chronicCondition = await prisma.studentChronicCondition.create({
      data: {
        studentId,
        tenantId,
        condition,
        diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : null,
        status: status || 'ACTIVE',
        severity,
        treatment,
        medication,
        nextCheckup: nextCheckup ? new Date(nextCheckup) : null,
        notes,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ condition: chronicCondition });
  } catch (error) {
    console.error('Error creating chronic condition:', error);
    return NextResponse.json({ error: 'Failed to create chronic condition' }, { status: 500 });
  }
}