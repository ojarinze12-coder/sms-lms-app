import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;
    const date = formData.get('date') as string;
    const notifyParents = formData.get('notifyParents') === 'true';

    if (!file || !classId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: file, classId, date' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());
    
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const studentIdIndex = header.findIndex((h) => h === 'studentid' || h === 'student_id');
    const statusIndex = header.findIndex((h) => h === 'status');
    const remarksIndex = header.findIndex((h) => h === 'remarks');
    const lateIndex = header.findIndex((h) => h === 'lateminutes' || h === 'late_minutes');

    if (studentIdIndex === -1 || statusIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must contain studentId and status columns' },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const studentIdOrAdm = values[studentIdIndex];
      const status = values[statusIndex]?.toUpperCase();
      const remarks = remarksIndex !== -1 ? values[remarksIndex] : null;
      const lateMinutes = lateIndex !== -1 ? parseInt(values[lateIndex]) : null;

      if (!studentIdOrAdm || !status) {
        errors.push({ row: i + 1, error: 'Missing student ID or status' });
        continue;
      }

      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY'];
      if (!validStatuses.includes(status)) {
        errors.push({ row: i + 1, error: `Invalid status: ${status}` });
        continue;
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId: user.tenantId,
          OR: [
            { studentId: studentIdOrAdm },
            { id: studentIdOrAdm },
          ],
        },
      });

      if (!student) {
        errors.push({ row: i + 1, error: `Student not found: ${studentIdOrAdm}` });
        continue;
      }

      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: student.id,
          classId,
          date: attendanceDate,
        },
      });

      let attendance;
      if (existing) {
        attendance = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY',
            remarks,
            lateMinutes: lateMinutes || null,
          },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            studentId: student.id,
            classId,
            date: attendanceDate,
            status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY',
            remarks,
            lateMinutes: lateMinutes || null,
            tenantId: user.tenantId,
            recordedById: user.userId,
          },
        });
      }

      results.push({
        row: i + 1,
        studentId: student.studentId,
        status,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errorsList: errors,
    });
  } catch (error: any) {
    console.error('Error processing bulk attendance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
