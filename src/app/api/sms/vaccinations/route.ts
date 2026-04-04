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

    const vaccinations = await prisma.studentVaccination.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
      orderBy: { dateGiven: 'desc' },
    });

    return NextResponse.json({ vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 });
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
      vaccineName,
      vaccineType,
      dateGiven,
      nextDueDate,
      administeredBy,
      status,
      notes,
    } = body;

    const vaccination = await prisma.studentVaccination.create({
      data: {
        studentId,
        tenantId,
        vaccineName,
        vaccineType,
        dateGiven: dateGiven ? new Date(dateGiven) : new Date(),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        administeredBy,
        status: status || 'COMPLETED',
        notes,
        createdById: session.user.id,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
      },
    });

    return NextResponse.json({ vaccination });
  } catch (error) {
    console.error('Error creating vaccination:', error);
    return NextResponse.json({ error: 'Failed to create vaccination' }, { status: 500 });
  }
}