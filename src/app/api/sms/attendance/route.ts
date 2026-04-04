import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { sendAbsenceAlert } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');

    const where: any = { tenantId: user.tenantId };

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.date = {
        gte: searchDate,
        lt: nextDate
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            parents: {
              select: { phone: true },
            },
          },
        },
        class: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'mark') {
      return markAttendance(user, body);
    }

    if (action === 'bulk') {
      return bulkMarkAttendance(user, body);
    }

    if (action === 'send-alerts') {
      return sendAbsenceAlerts(user, body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function markAttendance(user: any, body: any) {
  const { studentId, classId, date, status, remarks, lateMinutes } = body;

  if (!studentId || !classId || !date || !status) {
    return NextResponse.json(
      { error: 'Missing required fields: studentId, classId, date, status' },
      { status: 400 }
    );
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findFirst({
    where: {
      studentId,
      classId,
      date: attendanceDate,
    },
  });

  let attendance;
  if (existing) {
    attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status,
        remarks,
        lateMinutes: lateMinutes || null,
      },
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        date: attendanceDate,
        status,
        remarks,
        lateMinutes: lateMinutes || null,
        tenantId: user.tenantId,
        recordedById: user.id,
      },
    });
  }

  if (status === 'ABSENT') {
    await notifyParentOfAbsence(user.tenantId, studentId, classId, attendanceDate);
  }

  return NextResponse.json({ attendance });
}

async function bulkMarkAttendance(user: any, body: any) {
  const { classId, date, records, notifyParents } = body;

  if (!classId || !date || !records || !Array.isArray(records)) {
    return NextResponse.json(
      { error: 'Missing required fields: classId, date, records (array)' },
      { status: 400 }
    );
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];
  const absentStudents: string[] = [];

  for (const record of records) {
    const { studentId, status, remarks, lateMinutes } = record;

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        classId,
        date: attendanceDate,
      },
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          remarks,
          lateMinutes: lateMinutes || null,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId,
          classId,
          date: attendanceDate,
          status,
          remarks,
          lateMinutes: lateMinutes || null,
          tenantId: user.tenantId,
          recordedById: user.id,
        },
      });
    }

    results.push(attendance);

    if (status === 'ABSENT' && notifyParents) {
      absentStudents.push(studentId);
    }
  }

  if (notifyParents && absentStudents.length > 0) {
    for (const studentId of absentStudents) {
      await notifyParentOfAbsence(user.tenantId, studentId, classId, attendanceDate);
    }
  }

  return NextResponse.json({
    success: true,
    marked: results.length,
  });
}

async function sendAbsenceAlerts(user: any, body: any) {
  const { classId, date } = body;

  if (!classId || !date) {
    return NextResponse.json(
      { error: 'Missing required fields: classId, date' },
      { status: 400 }
    );
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const absentRecords = await prisma.attendance.findMany({
    where: {
      tenantId: user.tenantId,
      classId,
      date: attendanceDate,
      status: 'ABSENT',
    },
    include: {
      student: {
        include: { parents: true },
      },
    },
  });

  const results = [];
  for (const record of absentRecords) {
    const parent = record.student.parents[0];
    if (parent?.phone) {
      const result = await sendAbsenceAlert(
        parent.phone,
        `${record.student.firstName} ${record.student.lastName}`,
        date,
        record.remarks || 'No reason provided'
      );
      results.push({
        studentId: record.studentId,
        phone: parent.phone,
        success: result.success,
        error: result.error,
      });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  });
}

async function notifyParentOfAbsence(
  tenantId: string,
  studentId: string,
  classId: string,
  date: Date
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { parents: true },
  });

  if (!student || !student.parents[0]?.phone) return;

  const classRecord = await prisma.academicClass.findFirst({
    where: { id: classId, academicYear: { tenantId } },
  });

  await sendAbsenceAlert(
    student.parents[0].phone,
    `${student.firstName} ${student.lastName}`,
    classRecord?.name || 'Class',
    date.toISOString().split('T')[0]
  );
}
