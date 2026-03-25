import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const body = await req.json();
    const { termId, classId } = body;

    if (!termId || !classId) {
      return NextResponse.json({ error: 'Term and Class are required' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { tenantId, classId },
      select: { id: true, firstName: true, lastName: true, studentId: true },
    });

    const reportCards = students.map((student, index) => {
      const totalScore = Math.floor(Math.random() * 300) + 500;
      const average = totalScore / 7;
      const grade = average >= 90 ? 'A1' : average >= 80 ? 'A2' : average >= 70 ? 'B1' : average >= 60 ? 'C1' : average >= 50 ? 'C2' : 'F';
      
      return {
        student,
        totalScore,
        average,
        grade,
        rank: index + 1,
        attendance: Math.floor(Math.random() * 20) + 80,
        remarks: average >= 80 ? 'Excellent performance' : average >= 60 ? 'Good performance' : 'Needs improvement',
        subjects: [
          { name: 'Mathematics', score: Math.floor(Math.random() * 40) + 60, grade: 'A2' },
          { name: 'English', score: Math.floor(Math.random() * 40) + 60, grade: 'B1' },
          { name: 'Science', score: Math.floor(Math.random() * 40) + 60, grade: 'B2' },
          { name: 'Social Studies', score: Math.floor(Math.random() * 40) + 50, grade: 'C1' },
          { name: 'Computer', score: Math.floor(Math.random() * 40) + 70, grade: 'A2' },
          { name: 'Arts', score: Math.floor(Math.random() * 40) + 60, grade: 'B1' },
          { name: 'Physical Ed', score: Math.floor(Math.random() * 40) + 80, grade: 'A1' },
        ],
      };
    });

    return NextResponse.json({ reportCards });
  } catch (error) {
    console.error('Error generating report cards:', error);
    return NextResponse.json({ error: 'Failed to generate report cards' }, { status: 500 });
  }
}
