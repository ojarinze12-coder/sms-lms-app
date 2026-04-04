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

    const vaccinations = await prisma.studentVaccination.findMany({
      where: {
        studentId,
        tenantId,
      },
      orderBy: {
        dateGiven: 'desc',
      },
    });

    return NextResponse.json({ vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 });
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
      vaccineName,
      vaccineType,
      dateGiven,
      nextDueDate,
      batchNo,
      lotNo,
      site,
      administeredBy,
      adminTitle,
      facility,
      reactions,
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
        batchNo,
        lotNo,
        site,
        administeredBy,
        adminTitle,
        facility,
        reactions,
        status: status || 'COMPLETED',
        notes,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ vaccination });
  } catch (error) {
    console.error('Error creating vaccination record:', error);
    return NextResponse.json({ error: 'Failed to create vaccination record' }, { status: 500 });
  }
}