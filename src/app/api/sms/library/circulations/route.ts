import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const issueBookSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  bookId: z.string().uuid('Invalid book ID'),
  dueDays: z.number().default(14),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const circulations = await prisma.libraryCirculation.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json(circulations || []);
  } catch (error) {
    console.error('Circulation GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, bookId, dueDays } = issueBookSchema.parse(body);

    const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
    if (!book || book.available < 1) {
      return NextResponse.json({ error: 'Book not available' }, { status: 400 });
    }

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const circulation = await prisma.libraryCirculation.create({
      data: {
        studentId,
        bookId,
        issueDate,
        dueDate,
        status: 'ISSUE',
        tenantId: authUser.tenantId,
      },
    });

    await prisma.libraryBook.update({
      where: { id: bookId },
      data: { available: { decrement: 1 } },
    });

    return NextResponse.json(circulation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Circulation POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { circulationId, action } = body;

    if (!circulationId || !action) {
      return NextResponse.json({ error: 'Circulation ID and action required' }, { status: 400 });
    }

    const circulation = await prisma.libraryCirculation.findUnique({
      where: { id: circulationId },
    });

    if (!circulation) {
      return NextResponse.json({ error: 'Circulation not found' }, { status: 404 });
    }

    if (action === 'return') {
      const updated = await prisma.libraryCirculation.update({
        where: { id: circulationId },
        data: {
          status: 'RETURN',
          returnDate: new Date(),
        },
      });

      await prisma.libraryBook.update({
        where: { id: circulation.bookId },
        data: { available: { increment: 1 } },
      });

      const today = new Date();
      if (today > circulation.dueDate) {
        const daysOverdue = Math.floor((today.getTime() - circulation.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 50;
        await prisma.libraryCirculation.update({
          where: { id: circulationId },
          data: { fine },
        });
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Circulation PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
